import { SlashCommandBuilder } from "discord.js";

const RESPOSTAS = [
  "com certeza!",
  "sem dúvida.",
  "sim.",
  "provavelmente sim.",
  "as chances são boas.",
  "não tá muito claro, tenta de novo.",
  "pergunta de novo mais tarde.",
  "melhor não contar com isso.",
  "minha resposta é não.",
  "muito improvável.",
  "com certeza não.",
];

export default {
  data: new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Pergunte algo pra bola 8")
    .addStringOption((opt) => opt.setName("pergunta").setDescription("Sua pergunta").setRequired(true)),

  async execute(interaction) {
    const pergunta = interaction.options.getString("pergunta");
    const resposta = RESPOSTAS[Math.floor(Math.random() * RESPOSTAS.length)];
    await interaction.reply(`🎱 **Pergunta:** ${pergunta}\n**Resposta:** ${resposta}`);
  },
};
