import { SlashCommandBuilder } from "discord.js";

const PIADAS = [
  "Por que o livro de matemática se matou? Porque tinha muitos problemas.",
  "O que o pato disse pra pata? Vem quá.",
  "Por que o computador foi ao médico? Porque estava com vírus.",
  "O que é um cachorro sem rabo? Sem graça.",
  "Por que a galinha atravessou a rua? Pra fugir do KFC.",
  "Qual é o cúmulo da sorte? Cair de bunda numa agulha e não furar.",
  "O que o zero disse pro oito? Belo cinto.",
];

export default {
  data: new SlashCommandBuilder().setName("piada").setDescription("Conta uma piada aleatória"),

  async execute(interaction) {
    const piada = PIADAS[Math.floor(Math.random() * PIADAS.length)];
    await interaction.reply(`😂 ${piada}`);
  },
};
