// Roda com: npm run deploy-commands
//
// - Se DISCORD_GUILD_ID estiver definido: registra só nesse servidor (aparece
//   instantaneamente, bom pra testar).
// - Se DISCORD_GUILD_ID NÃO estiver definido: registra GLOBALMENTE — os
//   comandos passam a aparecer automaticamente em QUALQUER servidor onde o
//   bot for adicionado, sem precisar rodar esse script de novo pra cada
//   servidor novo. Pode levar até ~1h pra propagar na primeira vez.
import "dotenv/config";
import { REST, Routes } from "discord.js";
import { commands } from "./commands/index.js";

const { DISCORD_BOT_TOKEN, AUTH_DISCORD_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_BOT_TOKEN || !AUTH_DISCORD_ID) {
  console.error(
    "❌ Faltam variáveis no .env:\n   - DISCORD_BOT_TOKEN\n   - AUTH_DISCORD_ID (client id)"
  );
  process.exit(1);
}

const body = commands.map((c) => c.data.toJSON());
const rest = new REST({ version: "10" }).setToken(DISCORD_BOT_TOKEN);

try {
  if (DISCORD_GUILD_ID) {
    console.log(`📡 Registrando ${body.length} comandos no servidor ${DISCORD_GUILD_ID}...`);
    await rest.put(Routes.applicationGuildCommands(AUTH_DISCORD_ID, DISCORD_GUILD_ID), { body });
    console.log("✅ Pronto! Os comandos já devem aparecer nesse servidor instantaneamente.");
  } else {
    console.log(`📡 Registrando ${body.length} comandos GLOBALMENTE (todos os servidores)...`);
    await rest.put(Routes.applicationCommands(AUTH_DISCORD_ID), { body });
    console.log("✅ Pronto! Pode levar até 1h pra aparecer em todo mundo, mas depois disso");
    console.log("   qualquer servidor novo onde o bot entrar já vai ter os comandos na hora.");
  }
} catch (err) {
  console.error("❌ Falha ao registrar comandos:", err);
  process.exit(1);
}

