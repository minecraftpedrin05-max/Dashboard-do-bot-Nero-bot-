import { auth, signIn } from "../../auth.js";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  const botName = process.env.NEXT_PUBLIC_BOT_NAME || "Meu Bot";

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <span className="dot" style={{ background: "#4ADE80" }} />
          <span className="font-mono text-xs text-muted uppercase tracking-widest">painel de controle</span>
        </div>
        <h1 className="font-display text-4xl font-bold mb-3">{botName}</h1>
        <p className="text-muted mb-10 leading-relaxed">
          Entre com sua conta do Discord pra configurar o bot. Só quem administra o servidor consegue mexer nas
          configurações.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("discord", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full bg-amber text-bg font-semibold py-3 rounded-lg hover:brightness-110 transition"
          >
            Entrar com Discord
          </button>
        </form>
      </div>
    </main>
  );
}
