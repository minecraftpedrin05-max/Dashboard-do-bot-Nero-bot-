"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="pt-BR">
      <body className="bg-bg text-ink font-body antialiased">
        <main className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <p className="font-display text-6xl font-bold text-danger leading-none mb-3">:(</p>
            <h1 className="font-display text-xl font-bold mb-2">Algo deu errado</h1>
            <p className="text-muted text-sm mb-6">
              O painel encontrou um erro inesperado. Tenta de novo — se continuar, avisa quem administra o bot.
            </p>
            <button
              onClick={() => reset()}
              className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition"
            >
              Tentar de novo
            </button>
            {process.env.NODE_ENV === "development" && (
              <pre className="mt-6 text-left text-xs text-muted font-mono bg-surface border border-border rounded-lg p-3 overflow-auto max-h-40">
                {error?.message}
              </pre>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
