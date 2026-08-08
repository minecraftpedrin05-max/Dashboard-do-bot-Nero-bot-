import { SlashCommandBuilder } from "discord.js";
import { claimDaily } from "../../../lib/db.js";

function formatTempo(ms) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}min`;
}

export default {
  data: new SlashCommandBuilder().setName("diario").setDescription("Resgata sua recompensa diária de moedas"),

  async execute(interaction) {
    const result = claimDaily(interaction.guild.id, interaction.user.id);

    if (!result.success) {
      return interaction.reply({
        content: `⏳ Você já pegou o diário hoje. Volta em **${formatTempo(result.remainingMs)}**.`,
        ephemeral: true,
      });
    }

    await interaction.reply(
      `🎁 Você resgatou **${result.amount}** moedas! Saldo atual: **${result.newBalance}**.`
    );
  },
};
