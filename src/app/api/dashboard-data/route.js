import { auth } from "../../../../auth.js";
import { getSettings, getRecentWarnings, getLeaderboard } from "../../../lib/db.js";
import { getBotClient } from "../../../lib/discord-bot.js";

const GUILD_ID = process.env.DISCORD_GUILD_ID;

export async function GET() {
  const session = await auth();
  if (!session?.isServerAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = getSettings(GUILD_ID);
  const recentWarnings = getRecentWarnings(GUILD_ID, 15);
  const leaderboard = getLeaderboard(GUILD_ID, 5);

  const client = getBotClient();
  const guild = client?.guilds.cache.get(GUILD_ID);

  const channels = guild
    ? [...guild.channels.cache.filter((c) => c.type === 0).values()].map((c) => ({ id: c.id, name: c.name }))
    : [];

  const enrichedWarnings = await Promise.all(
    recentWarnings.map(async (w) => {
      const user = client ? await client.users.fetch(w.user_id).catch(() => null) : null;
      return { ...w, userTag: user?.tag || w.user_id };
    })
  );

  const enrichedLeaderboard = await Promise.all(
    leaderboard.map(async (row) => {
      const user = client ? await client.users.fetch(row.user_id).catch(() => null) : null;
      return { ...row, userTag: user?.tag || row.user_id };
    })
  );

  return Response.json({
    online: !!client?.isReady(),
    guildName: guild?.name || null,
    memberCount: guild?.memberCount || null,
    settings,
    channels,
    recentWarnings: enrichedWarnings,
    leaderboard: enrichedLeaderboard,
  });
}
