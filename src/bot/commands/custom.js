import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from "discord.js";
import { listCommands, listCommandButtons } from "../../lib/db.js";

const STYLES = {
  Primary: ButtonStyle.Primary,
  Secondary: ButtonStyle.Secondary,
  Success: ButtonStyle.Success,
  Danger: ButtonStyle.Danger,
};

export default {
  data: new SlashCommandBuilder()
    .setName("comando")
    .setDescription("Escolha um comando personalizado para executar"),

  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "Esse comando só funciona dentro de um servidor.", ephemeral: true });
      return;
    }

    const all = listCommands(interaction.guild.id);
    if (all.length === 0) {
      await interaction.reply({ content: "Nenhum comando personalizado criado ainda.", ephemeral: true });
      return;
    }

    // Select menu com todos os comandos
    const select = new StringSelectMenuBuilder()
      .setCustomId("select_command")
      .setPlaceholder("Escolha um comando")
      .addOptions(
        all.slice(0, 25).map((c) => ({
          label: c.name.slice(0, 80),
          value: String(c.id),
          description: (c.description || "sem descrição").slice(0, 100),
        }))
      );

    const row = new ActionRowBuilder().addComponents(select);
    await interaction.reply({ components: [row], ephemeral: true });
  },
};

