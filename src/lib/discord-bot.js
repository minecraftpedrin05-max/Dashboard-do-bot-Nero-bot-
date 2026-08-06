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
} from "./db.js";

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

  client.once(Events.ClientReady, (c) => {
    console.log(`[bot] online como ${c.user.tag}`);
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

        if (buttons.length > 0) {
          const row = new ActionRowBuilder();
          for (const b of buttons.slice(0, 5)) {
            if (b.action_type === "link" && b.url) {
              row.addComponents(new ButtonBuilder().setLabel(b.label).setStyle(ButtonStyle.Link).setURL(b.url));
            } else {
              row.addComponents(
                new ButtonBuilder()
                  .setCustomId(`cmdbtn_${b.id}`)
                  .setLabel(b.label)
                  .setStyle(STYLES[b.style] || ButtonStyle.Primary)
              );
            }
          }
          components.push(row);
        }

        await interaction.reply({ embeds: [embed], components });
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
        if (!button || button.action_type !== "modal" || !button.modal_id) return;

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
