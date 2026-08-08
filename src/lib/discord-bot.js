import {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { commands } from "../bot/commands/index.js";
import {
  getSettings,
  addXp,
  getCommand,
  getCommandButton,
  getModal,
  listModalFields,
  listCommandButtons,
  saveModalSubmission,
  setUserGuild,
  getUserGuild,
  logActivity,
} from "./db.js";
import { generateAIReply } from "./ai.js";

// Atualiza o nome do canal de contador em cada servidor onde o bot está e
// que tenha um counter_channel_id configurado. Chamado no ready e a cada
// 10 minutos (limite do Discord: 2 mudanças de nome por canal a cada 10min).
async function updateAllCounters(client) {
  for (const guild of client.guilds.cache.values()) {
    const settings = getSettings(guild.id);
    if (!settings.counter_channel_id) continue;

    const channel = guild.channels.cache.get(settings.counter_channel_id);
    if (!channel) continue;

    await guild.members.fetch().catch(() => {});
    const newName = `👥 Membros: ${guild.memberCount}`;
    if (channel.name !== newName) {
      await channel.setName(newName).catch(() => {});
    }
  }
}

// Cria o canal privado de ticket (mesma lógica usada pelo botão "Ticket").
// Isso é código determinístico e controlado — não é a IA decidindo executar
// isso, é o admin que liga essa opção no dashboard para o botão de IA.
//
// `containerConfig` (opcional) é o conteúdo extra configurado pelo admin
// (título + descrição + botões como "Chamar ADM") que é enviado como uma
// segunda mensagem dentro do ticket. `commandButtonId` é o id do botão no
// banco, usado pra reconstruir a config quando algum desses botões extras
// for clicado depois.
async function createTicketChannel(interaction, welcomeTemplate, containerConfig, commandButtonId) {
  const safeName = interaction.user.username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 20);
  const channelName = `ticket-${safeName}-${interaction.user.discriminator !== "0" ? interaction.user.discriminator : interaction.user.id.slice(-4)}`;

  const channel = await interaction.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ],
  });

  const welcome = (welcomeTemplate || "Olá {user}, um membro da equipe vai te atender em breve!").replaceAll(
    "{user}",
    `<@${interaction.user.id}>`
  );

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticketclose_${channel.id}`).setLabel("Fechar Ticket").setStyle(ButtonStyle.Danger)
  );

  await channel.send({ content: welcome, components: [closeRow] });

  if (containerConfig?.enabled && (containerConfig.title || containerConfig.description || containerConfig.buttons?.length)) {
    const embed = new EmbedBuilder().setColor(0x5865f2);
    if (containerConfig.title) embed.setTitle(containerConfig.title.slice(0, 256));
    if (containerConfig.description) embed.setDescription(containerConfig.description.slice(0, 4000));

    const extraButtons = (containerConfig.buttons || []).slice(0, 5).map((cb, idx) =>
      new ButtonBuilder()
        .setCustomId(`ticketextra_${commandButtonId}_${idx}_${channel.id}`)
        .setLabel((cb.label || "Botão").slice(0, 80))
        .setStyle(cb.type === "call_admin" ? ButtonStyle.Danger : ButtonStyle.Secondary)
    );

    const payload = { embeds: [embed] };
    if (extraButtons.length) payload.components = [new ActionRowBuilder().addComponents(extraButtons)];
    await channel.send(payload);
  }

  return channel;
}

export async function startBot() {
  // Next.js can call register() more than once (dev hot-reload, multiple
  // workers). Guard with a global so we never log in twice.
  if (global.__discordClient) {
    return global.__discordClient;
  }

  if (!process.env.DISCORD_BOT_TOKEN) {
    console.warn("[bot] DISCORD_BOT_TOKEN não definido — bot não vai iniciar.");
    return null;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.commands = new Collection();
  for (const command of commands) {
    client.commands.set(command.data.name, command);
  }

  client.once(Events.ClientReady, async (c) => {
    console.log(`[bot] online como ${c.user.tag}`);

    // Registra os comandos slash GLOBALMENTE toda vez que o bot liga, assim
    // eles aparecem sozinhos em qualquer servidor onde o bot for adicionado
    // (dono não precisa rodar nenhum script nem configurar servidor por
    // servidor). Pode levar até ~1h pra propagar da primeira vez.
    try {
      const { REST, Routes } = await import("discord.js");
      const body = commands.map((cmd) => cmd.data.toJSON());
      const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);
      await rest.put(Routes.applicationCommands(c.user.id), { body });
      console.log(`[bot] ${body.length} comandos registrados globalmente`);
    } catch (err) {
      console.error("[bot] falha ao registrar comandos globalmente:", err);
    }

    // Contador de membros: atualiza o nome do canal configurado em cada
    // servidor a cada 10 minutos (Discord só permite 2 mudanças de nome
    // por canal a cada 10min, então não dá pra atualizar em tempo real).
    updateAllCounters(c).catch(() => {});
    setInterval(() => updateAllCounters(c).catch(() => {}), 10 * 60 * 1000);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    // Modal de configuração do servidor (/colocar)
    if (interaction.isModalSubmit() && interaction.customId === "modal_set_guild") {
      try {
        const guildId = interaction.fields.getTextInputValue("guild_id_input");
        if (!guildId || !/^\d+$/.test(guildId)) {
          await interaction.reply({ content: "❌ ID inválido! Tem que ser só números.", ephemeral: true });
          return;
        }

        setUserGuild(interaction.user.id, guildId);
        await interaction.reply({
          content: `✅ Pronto! Você vai criar comandos para o servidor **${guildId}**.\n\nAgora acessa o dashboard em http://localhost:3000 e vai na aba **Comandos** pra criar.`,
          ephemeral: true,
        });
      } catch (err) {
        console.error("[bot] erro ao salvar guild:", err);
        await interaction.reply({ content: "Deu erro ao salvar 😵", ephemeral: true });
      }
      return;
    }

    // Select menu de comandos
    if (interaction.isStringSelectMenu() && interaction.customId === "select_command") {
      try {
        const commandId = Number(interaction.values[0]);
        const cmd = getCommand(commandId);
        if (!cmd) {
          await interaction.reply({ content: "Comando não encontrado.", ephemeral: true });
          return;
        }

        const embed = new EmbedBuilder().setColor(cmd.color || "#5865F2");
        if (cmd.title) embed.setTitle(cmd.title);
        if (cmd.body_text) embed.setDescription(cmd.body_text);
        if (cmd.image_url) embed.setImage(cmd.image_url);

        const buttons = listCommandButtons(cmd.id);
        const components = [];
        const STYLES = {
          Primary: ButtonStyle.Primary,
          Secondary: ButtonStyle.Secondary,
          Success: ButtonStyle.Success,
          Danger: ButtonStyle.Danger,
        };

        let row = new ActionRowBuilder();
        for (const b of buttons) {
          if (b.action_type === "select") {
            // um select menu ocupa a linha inteira sozinho
            if (row.components.length > 0) {
              components.push(row);
              row = new ActionRowBuilder();
            }
            let options = [];
            try {
              options = JSON.parse(b.options_json || "[]");
            } catch {
              options = [];
            }
            if (options.length === 0) continue;
            const menu = new StringSelectMenuBuilder()
              .setCustomId(`cmdselect_${b.id}`)
              .setPlaceholder(b.label || "Escolha uma opção")
              .setMinValues(1)
              .setMaxValues(b.multi ? Math.min(options.length, 25) : 1)
              .addOptions(
                options.slice(0, 25).map((o) => ({
                  label: (o.label || "opção").slice(0, 100),
                  value: (o.label || "opção").slice(0, 100),
                  description: o.description ? o.description.slice(0, 100) : undefined,
                }))
              );
            components.push(new ActionRowBuilder().addComponents(menu));
          } else if (b.action_type === "link" && b.url) {
            if (row.components.length >= 5) {
              components.push(row);
              row = new ActionRowBuilder();
            }
            row.addComponents(new ButtonBuilder().setLabel(b.label).setStyle(ButtonStyle.Link).setURL(b.url));
          } else {
            if (row.components.length >= 5) {
              components.push(row);
              row = new ActionRowBuilder();
            }
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`cmdbtn_${b.id}`)
                .setLabel(b.label)
                .setStyle(STYLES[b.style] || ButtonStyle.Primary)
            );
          }
        }
        if (row.components.length > 0) components.push(row);

        await interaction.reply({ embeds: [embed], components, ephemeral: cmd.is_public === 0 });
      } catch (err) {
        console.error("[bot] erro ao exibir comando:", err);
      }
      return;
    }

    // /comando e demais comandos com autocomplete (ex: nome do comando personalizado)
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) {
        try {
          await command.autocomplete(interaction);
        } catch (err) {
          console.error(`[bot] erro no autocomplete de /${interaction.commandName}:`, err);
        }
      }
      return;
    }

    // Comandos slash normais
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`[bot] erro no comando /${interaction.commandName}:`, err);
        const payload = { content: "Deu ruim ao executar esse comando 😵", ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload).catch(() => {});
        } else {
          await interaction.reply(payload).catch(() => {});
        }
      }
      return;
    }

    // Botão de um comando personalizado -> abre o formulário (modal) configurado
    if (interaction.isButton() && interaction.customId.startsWith("cmdbtn_")) {
      try {
        const buttonId = Number(interaction.customId.replace("cmdbtn_", ""));
        const button = getCommandButton(buttonId);
        if (!button) return;

        // Botão de IA: gera uma resposta em texto a partir da instrução do admin.
        // Se o admin ligou "ai_open_ticket" na configuração do botão, também abre
        // um ticket de verdade — usando o mesmo código determinístico do botão
        // "Ticket" (a IA não decide isso sozinha, é uma opção fixa do admin).
        if (button.action_type === "ai") {
          const wantsTicket = !!button.ai_open_ticket;
          await interaction.deferReply({ ephemeral: wantsTicket });
          const reply = await generateAIReply(button.output_template, { username: interaction.user.username });

          if (wantsTicket) {
            try {
              const channel = await createTicketChannel(interaction, null);
              await interaction.editReply({ content: `${reply}\n\n✅ Ticket criado: <#${channel.id}>` });
            } catch (err) {
              console.error("[bot] erro ao abrir ticket via botão de IA:", err);
              await interaction.editReply({ content: `${reply}\n\n⚠️ Não consegui abrir o ticket agora.` });
            }
          } else {
            await interaction.editReply({ content: reply });
          }
          return;
        }

        // Botão de ticket: cria um canal privado (só a pessoa + admins veem)
        if (button.action_type === "ticket") {
          await interaction.deferReply({ ephemeral: true });
          const containerConfig = button.ticket_container_json ? JSON.parse(button.ticket_container_json) : null;
          const channel = await createTicketChannel(interaction, button.output_template, containerConfig, button.id);
          await interaction.editReply({ content: `✅ Ticket criado: <#${channel.id}>` });
          return;
        }

        // Botão de cargo (Reaction Role): clicar dá o cargo, clicar de novo tira.
        if (button.action_type === "role") {
          await interaction.deferReply({ ephemeral: true });
          if (!button.role_id) {
            await interaction.editReply({ content: "Esse botão não tem um cargo configurado ainda." });
            return;
          }
          const member = interaction.member;
          const hasRole = member.roles.cache.has(button.role_id);
          try {
            if (hasRole) {
              await member.roles.remove(button.role_id);
              logActivity(interaction.guild.id, "reaction_role", {
                actorTag: interaction.user.tag,
                detail: `removeu cargo <@&${button.role_id}>`,
              });
              await interaction.editReply({ content: `➖ Cargo <@&${button.role_id}> removido.` });
            } else {
              await member.roles.add(button.role_id);
              logActivity(interaction.guild.id, "reaction_role", {
                actorTag: interaction.user.tag,
                detail: `ganhou cargo <@&${button.role_id}>`,
              });
              await interaction.editReply({ content: `✅ Cargo <@&${button.role_id}> adicionado.` });
            }
          } catch {
            await interaction.editReply({
              content: "Não consegui alterar esse cargo (confere se o cargo do bot está acima dele).",
            });
          }
          return;
        }

        if (button.action_type !== "modal" || !button.modal_id) return;

        const modal = getModal(button.modal_id);
        const fields = listModalFields(button.modal_id);
        if (!modal || fields.length === 0) {
          await interaction.reply({
            content: "Esse botão não tem um formulário configurado ainda.",
            ephemeral: true,
          });
          return;
        }

        const modalBuilder = new ModalBuilder()
          .setCustomId(`cmdmodal_${modal.id}`)
          .setTitle(modal.title.slice(0, 45));

        for (const f of fields.slice(0, 5)) {
          const input = new TextInputBuilder()
            .setCustomId(f.field_key)
            .setLabel(f.label.slice(0, 45))
            .setStyle(f.style === "paragraph" ? TextInputStyle.Paragraph : TextInputStyle.Short)
            .setRequired(!!f.required);
          modalBuilder.addComponents(new ActionRowBuilder().addComponents(input));
        }

        await interaction.showModal(modalBuilder);
      } catch (err) {
        console.error("[bot] erro ao abrir formulário:", err);
      }
      return;
    }

    // Botão extra dentro de um ticket (ex: "Chamar ADM" ou texto fixo),
    // configurado pelo admin no dashboard. Só quem tem acesso ao canal do
    // ticket (a pessoa dona + quem já pode ver) consegue clicar.
    if (interaction.isButton() && interaction.customId.startsWith("ticketextra_")) {
      try {
        const [, commandButtonId, idxStr] = interaction.customId.split("_");
        const canView = interaction.channel?.permissionsFor(interaction.user)?.has(PermissionFlagsBits.ViewChannel);
        const isAdmin = interaction.member?.permissions?.has(PermissionFlagsBits.Administrator);
        if (!canView && !isAdmin) {
          await interaction.reply({ content: "Você não pode usar esse botão aqui.", ephemeral: true });
          return;
        }

        const button = getCommandButton(Number(commandButtonId));
        const config = button?.ticket_container_json ? JSON.parse(button.ticket_container_json) : null;
        const cb = config?.buttons?.[Number(idxStr)];
        if (!cb) {
          await interaction.reply({ content: "Esse botão não está mais configurado.", ephemeral: true });
          return;
        }

        if (cb.type === "call_admin") {
          if (!cb.role_id) {
            await interaction.reply({ content: "⚠️ Nenhum cargo de admin foi configurado pra esse botão.", ephemeral: true });
            return;
          }
          await interaction.reply({
            content: `<@&${cb.role_id}> ${interaction.user} está chamando a administração neste ticket.`,
          });
        } else {
          await interaction.reply({ content: cb.text || "Sem conteúdo configurado.", ephemeral: true });
        }
      } catch (err) {
        console.error("[bot] erro no botão extra do ticket:", err);
      }
      return;
    }

    // Fechar um ticket -> só admin ou quem tem acesso ao canal pode fechar
    if (interaction.isButton() && interaction.customId.startsWith("ticketclose_")) {
      try {
        const isAdmin = interaction.member?.permissions?.has(PermissionFlagsBits.Administrator);
        const canView = interaction.channel
          ?.permissionsFor(interaction.user)
          ?.has(PermissionFlagsBits.ViewChannel);
        if (!isAdmin && !canView) {
          await interaction.reply({ content: "Você não pode fechar esse ticket.", ephemeral: true });
          return;
        }
        await interaction.reply({ content: "🔒 Fechando ticket em 5 segundos..." });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      } catch (err) {
        console.error("[bot] erro ao fechar ticket:", err);
      }
      return;
    }

    // Select menu de um comando personalizado -> monta a mensagem de saída
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("cmdselect_")) {
      try {
        const buttonId = Number(interaction.customId.replace("cmdselect_", ""));
        const button = getCommandButton(buttonId);
        if (!button) return;

        const selected = interaction.values.join(", ");

        if (button.ai_mode) {
          await interaction.deferReply({ ephemeral: true });
          const reply = await generateAIReply(button.output_template, {
            username: interaction.user.username,
            selected,
          });
          await interaction.editReply({ content: reply });
          return;
        }

        let output = button.output_template || "Você escolheu: {selecionado}";
        output = output.replaceAll("{selecionado}", selected);

        await interaction.reply({ content: output, ephemeral: true });
      } catch (err) {
        console.error("[bot] erro ao processar select:", err);
      }
      return;
    }

    // Envio do formulário -> monta a mensagem final substituindo {campo}
    if (interaction.isModalSubmit() && interaction.customId.startsWith("cmdmodal_")) {
      try {
        const modalId = Number(interaction.customId.replace("cmdmodal_", ""));
        const modal = getModal(modalId);
        const fields = listModalFields(modalId);
        if (!modal) return;

        const data = {};
        for (const f of fields) {
          data[f.field_key] = interaction.fields.getTextInputValue(f.field_key);
        }

        saveModalSubmission(modalId, interaction.guild?.id || "unknown", interaction.user.id, data);

        let output = modal.output_template || "";
        for (const [key, value] of Object.entries(data)) {
          output = output.replaceAll(`{${key}}`, value);
        }

        await interaction.reply({ content: output || "Formulário enviado! ✅" });
      } catch (err) {
        console.error("[bot] erro ao processar formulário:", err);
        const payload = { content: "Deu ruim ao processar o formulário 😵", ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload).catch(() => {});
        } else {
          await interaction.reply(payload).catch(() => {});
        }
      }
    }
  });

  // Ganho de XP por mensagem (respeita o toggle do dashboard)
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;

    const settings = getSettings(message.guild.id);
    if (!settings.xp_enabled) return;

    const gain = Math.floor(Math.random() * 8) + 4;
    const result = addXp(message.guild.id, message.author.id, gain);

    if (result.leveledUp) {
      const text =
        settings.persona === "feminino"
          ? `🎉 ${message.author} subiu pro nível **${result.level}**! Arrasou!`
          : `🎉 ${message.author} subiu pro nível **${result.level}**! Mandou bem!`;
      message.channel.send(text).catch(() => {});
    }
  });

  // Mensagem de boas-vindas (configurada pelo dashboard)
  client.on(Events.GuildMemberAdd, async (member) => {
    const settings = getSettings(member.guild.id);

    if (settings.autorole_id) {
      member.roles.add(settings.autorole_id).catch(() => {
        // cargo do bot pode estar abaixo do autorole, ou o cargo foi apagado — ignora silenciosamente
      });
      logActivity(member.guild.id, "autorole", { targetTag: member.user.tag });
    }

    if (!settings.welcome_channel_id) return;

    const channel = member.guild.channels.cache.get(settings.welcome_channel_id);
    if (!channel) return;

    const defaultMsg =
      settings.persona === "feminino"
        ? "Chegou {user}! Sejam bem-vindes 💗"
        : "E aí {user}, bem-vindo ao servidor! 👋";

    const text = (settings.welcome_message || defaultMsg).replaceAll("{user}", `${member}`);
    channel.send(text).catch(() => {});
  });

  await client.login(process.env.DISCORD_BOT_TOKEN);
  global.__discordClient = client;
  return client;
}

export function getBotClient() {
  return global.__discordClient || null;
}
