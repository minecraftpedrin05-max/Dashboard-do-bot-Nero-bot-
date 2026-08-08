import { REST, Routes } from "discord.js";
import { auth } from "../../../../auth.js";
import { listCommands } from "../../../lib/db.js";
import { commands } from "../../../bot/commands/index.js";

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.AUTH_DISCORD_ID;

export async function POST(req) {
  const session = await auth();
  if (!session?.isServerAdmin || !session?.userGuild) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!BOT_TOKEN || !CLIENT_ID) {
    return Response.json({ error: "Bot token ou CLIENT_ID não configurados" }, { status: 500 });
  }

  try {
    // Registra todos os comandos embutidos do bot (incluindo /comando,
    // que é o que mostra a lista de comandos personalizados)
    const builtInCommands = commands.map((c) => c.data.toJSON());

    const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, session.userGuild), {
      body: builtInCommands,
    });

    return Response.json({
      ok: true,
      message: `✅ ${builtInCommands.length} comandos registrados no servidor ${session.userGuild}`,
    });
  } catch (err) {
    console.error("[deploy-commands] erro:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
