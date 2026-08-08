import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="font-display text-6xl font-bold text-accent leading-none mb-3">404</p>
        <h1 className="font-display text-xl font-bold mb-2">Essa página não existe</h1>
        <p className="text-muted text-sm mb-6">
          O endereço que você tentou abrir não foi encontrado. Confere se o link está certo ou volta pro painel.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition"
        >
          Voltar ao painel
        </Link>
      </div>
    </main>
  );
}
