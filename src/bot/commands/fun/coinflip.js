import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder().setName("moeda").setDescription("Joga uma moeda pra cima"),

  async execute(interaction) {
    const resultado = Math.random() < 0.5 ? "Cara" : "Coroa";
    await interaction.reply(`🪙 Deu **${resultado}**!`);
  },
};
