import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getBalance } from "../../../lib/db.js";

export default {
  data: new SlashCommandBuilder()
    .setName("saldo")
    .setDescription("Vê quantas moedas você (ou outra pessoa) tem")
    .addUserOption((opt) => opt.setName("usuario").setDescription("De quem ver o saldo").setRequired(false)),

  async execute(interaction) {
    const alvo = interaction.options.getUser("usuario") || interaction.user;
    const saldo = getBalance(interaction.guild.id, alvo.id);

    const embed = new EmbedBuilder()
      .setColor(0xf5a623)
      .setDescription(`🪙 **${alvo.tag}** tem **${saldo}** moeda${saldo === 1 ? "" : "s"}.`);

    await interaction.reply({ embeds: [embed] });
  },
};
