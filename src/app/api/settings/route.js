import { auth } from "../../../../auth.js";
import { updateSettings } from "../../../lib/db.js";

const GUILD_ID = process.env.DISCORD_GUILD_ID;

export async function POST(req) {
  const session = await auth();
  if (!session?.isServerAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updated = updateSettings(GUILD_ID, body);
  return Response.json({ ok: true, settings: updated });
}
