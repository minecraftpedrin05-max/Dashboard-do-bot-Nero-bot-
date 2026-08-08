import { SlashCommandBuilder } from "discord.js";
import { getLeaderboard } from "../../../lib/db.js";

export default {
  data: new SlashCommandBuilder().setName("leaderboard").setDescription("Top 10 do servidor por XP"),

  async execute(interaction) {
    const top = getLeaderboard(interaction.guild.id, 10);

    if (top.length === 0) {
      return interaction.reply("Ainda não tem ninguém no ranking.");
    }

    const linhas = await Promise.all(
      top.map(async (row, i) => {
        const user = await interaction.client.users.fetch(row.user_id).catch(() => null);
        const nome = user ? user.tag : row.user_id;
        return `**${i + 1}.** ${nome} — nível ${row.level} (${row.xp} XP)`;
      })
    );

    await interaction.reply(`🏆 **Ranking do servidor**\n${linhas.join("\n")}`);
  },
};
