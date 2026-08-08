import { SlashCommandBuilder } from "discord.js";
import { transferBalance } from "../../../lib/db.js";

export default {
  data: new SlashCommandBuilder()
    .setName("transferir")
    .setDescription("Transfere moedas suas pra outro membro")
    .addUserOption((opt) => opt.setName("usuario").setDescription("Pra quem transferir").setRequired(true))
    .addIntegerOption((opt) =>
      opt.setName("quantidade").setDescription("Quantas moedas").setRequired(true).setMinValue(1)
    ),

  async execute(interaction) {
    const alvo = interaction.options.getUser("usuario");
    const quantidade = interaction.options.getInteger("quantidade");

    if (alvo.id === interaction.user.id) {
      return interaction.reply({ content: "Não dá pra transferir pra você mesmo.", ephemeral: true });
    }
    if (alvo.bot) {
      return interaction.reply({ content: "Não dá pra transferir pra um bot.", ephemeral: true });
    }

    const result = transferBalance(interaction.guild.id, interaction.user.id, alvo.id, quantidade);

    if (!result.success) {
      return interaction.reply({ content: "Você não tem moedas suficientes.", ephemeral: true });
    }

    await interaction.reply(
      `✅ **${interaction.user.tag}** transferiu **${quantidade}** moedas pra **${alvo.tag}**.`
    );
  },
};
