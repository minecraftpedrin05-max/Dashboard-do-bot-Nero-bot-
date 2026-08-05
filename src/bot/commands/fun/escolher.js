import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("escolher")
    .setDescription("Escolhe uma opção aleatória entre as que você der")
    .addStringOption((opt) =>
      opt.setName("opcoes").setDescription("Opções separadas por vírgula").setRequired(true)
    ),

  async execute(interaction) {
    const opcoes = interaction.options
      .getString("opcoes")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    if (opcoes.length < 2) {
      return interaction.reply({ content: "Me dá pelo menos 2 opções separadas por vírgula.", ephemeral: true });
    }

    const escolhida = opcoes[Math.floor(Math.random() * opcoes.length)];
    await interaction.reply(`🤔 Eu escolho: **${escolhida}**`);
  },
};
