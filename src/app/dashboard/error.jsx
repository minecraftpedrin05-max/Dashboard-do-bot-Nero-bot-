"use client";

export default function DashboardError({ error, reset }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="font-display text-5xl font-bold text-danger leading-none mb-3">:(</p>
        <h1 className="font-display text-xl font-bold mb-2">O painel travou aqui</h1>
        <p className="text-muted text-sm mb-6">
          Alguma coisa deu errado carregando essa parte do dashboard. Tenta de novo.
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition"
        >
          Tentar de novo
        </button>
      </div>
    </main>
  );
}
