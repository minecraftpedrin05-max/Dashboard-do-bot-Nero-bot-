import { auth } from "../../../../auth.js";
import { getSettings, getRecentWarnings, getLeaderboard } from "../../../lib/db.js";
import { getBotClient } from "../../../lib/discord-bot.js";

const GUILD_ID = process.env.DISCORD_GUILD_ID;

export async function GET() {
  const t0 = Date.now();
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

  const voiceChannels = guild
    ? [...guild.channels.cache.filter((c) => c.type === 2).values()].map((c) => ({ id: c.id, name: c.name }))
    : [];

  // Cargos atribuíveis pelo dashboard (autorole / botões de cargo).
  // @everyone e cargos gerenciados por integrações (bot roles, boost role) ficam de fora.
  const roles = guild
    ? [...guild.roles.cache.filter((r) => r.id !== guild.id && !r.managed).values()]
        .sort((a, b) => b.position - a.position)
        .map((r) => ({ id: r.id, name: r.name, color: r.hexColor }))
    : [];

  const mem = process.memoryUsage();
  const stats = {
    ping: client?.ws?.ping ?? null,
    uptimeSeconds: client ? Math.floor(client.uptime / 1000) : null,
    memoryUsedMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
    memoryLimitMb: process.env.RAILWAY_MEMORY_LIMIT_MB
      ? Number(process.env.RAILWAY_MEMORY_LIMIT_MB)
      : null,
    roleCount: guild ? guild.roles.cache.size : null,
    channelCount: guild ? guild.channels.cache.size : null,
    emojiCount: guild ? guild.emojis.cache.size : null,
    boostCount: guild?.premiumSubscriptionCount ?? null,
    dbOnline: true,
  };

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
    guildIcon: guild?.iconURL?.({ size: 128 }) || null,
    memberCount: guild?.memberCount || null,
    settings,
    channels,
    voiceChannels,
    roles,
    recentWarnings: enrichedWarnings,
    leaderboard: enrichedLeaderboard,
    stats: { ...stats, responseMs: Date.now() - t0 },
  });
}
