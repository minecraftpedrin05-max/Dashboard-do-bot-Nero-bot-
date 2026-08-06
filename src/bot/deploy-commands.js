// Roda com: npm run deploy-commands
// DISCORD_GUILD_ID é OBRIGATÓRIO — registra só nesse servidor.
import "dotenv/config";
import { REST, Routes } from "discord.js";
import { commands } from "./commands/index.js";

const { DISCORD_BOT_TOKEN, AUTH_DISCORD_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_BOT_TOKEN || !AUTH_DISCORD_ID || !DISCORD_GUILD_ID) {
  console.error(
    "❌ Faltam variáveis no .env:\n   - DISCORD_BOT_TOKEN\n   - AUTH_DISCORD_ID (client id)\n   - DISCORD_GUILD_ID (id do servidor)"
  );
  process.exit(1);
}

const body = commands.map((c) => c.data.toJSON());
const rest = new REST({ version: "10" }).setToken(DISCORD_BOT_TOKEN);

try {
  console.log(`📡 Registrando ${body.length} comandos no servidor ${DISCORD_GUILD_ID}...`);
  await rest.put(Routes.applicationGuildCommands(AUTH_DISCORD_ID, DISCORD_GUILD_ID), { body });
  console.log("✅ Pronto! Os comandos já devem aparecer nesse servidor instantaneamente.");
} catch (err) {
  console.error("❌ Falha ao registrar comandos:", err);
  process.exit(1);
}
