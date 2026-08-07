export async function register() {
  // Só inicia o bot no runtime Node.js do servidor (não no edge/build).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startBot } = await import("./src/lib/discord-bot.js");
    try {
      await startBot();
    } catch (err) {
      console.error("[bot] falha ao iniciar:", err);
    }
  }
}
