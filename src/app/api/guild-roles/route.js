import { auth } from "../../../../auth.js";
import { getBotClient } from "../../../lib/discord-bot.js";

export async function GET() {
  const session = await auth();
  if (!session?.isServerAdmin || !session?.userGuild) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = getBotClient();
  const guild = client?.guilds.cache.get(session.userGuild);
  if (!guild) {
    return Response.json({ roles: [] });
  }

  const roles = [...guild.roles.cache.filter((r) => r.id !== guild.id && !r.managed).values()]
    .sort((a, b) => b.position - a.position)
    .map((r) => ({ id: r.id, name: r.name, color: r.hexColor }));

  return Response.json({ roles });
}
