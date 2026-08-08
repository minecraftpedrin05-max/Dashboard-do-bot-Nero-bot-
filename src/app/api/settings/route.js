import { auth } from "../../../../auth.js";
import { updateSettings } from "../../../lib/db.js";

const GUILD_ID = process.env.DISCORD_GUILD_ID;
const MAX_MESSAGE_LENGTH = 1500;

function sanitize(body) {
  const out = {};

  if (body.persona !== undefined) {
    out.persona = body.persona === "feminino" ? "feminino" : "masculino";
  }
  if (body.welcome_channel_id !== undefined) {
    out.welcome_channel_id = typeof body.welcome_channel_id === "string" ? body.welcome_channel_id.slice(0, 32) : "";
  }
  if (body.mod_log_channel_id !== undefined) {
    out.mod_log_channel_id = typeof body.mod_log_channel_id === "string" ? body.mod_log_channel_id.slice(0, 32) : "";
  }
  if (body.welcome_message !== undefined) {
    out.welcome_message =
      typeof body.welcome_message === "string" ? body.welcome_message.slice(0, MAX_MESSAGE_LENGTH) : "";
  }
  if (body.xp_enabled !== undefined) {
    out.xp_enabled = !!body.xp_enabled;
  }

  if (body.autorole_id !== undefined) {
    out.autorole_id = typeof body.autorole_id === "string" ? body.autorole_id.slice(0, 32) : "";
  }
  if (body.suggestions_channel_id !== undefined) {
    out.suggestions_channel_id = typeof body.suggestions_channel_id === "string" ? body.suggestions_channel_id.slice(0, 32) : "";
  }
  if (body.counter_channel_id !== undefined) {
    out.counter_channel_id = typeof body.counter_channel_id === "string" ? body.counter_channel_id.slice(0, 32) : "";
  }

  return out;
}

export async function POST(req) {
  const session = await auth();
  if (!session?.isServerAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  try {
    const clean = sanitize(body || {});
    const updated = updateSettings(GUILD_ID, clean);
    return Response.json({ ok: true, settings: updated });
  } catch (err) {
    console.error("[api/settings] erro ao salvar:", err);
    return Response.json({ error: "Não foi possível salvar as configurações" }, { status: 500 });
  }
}
