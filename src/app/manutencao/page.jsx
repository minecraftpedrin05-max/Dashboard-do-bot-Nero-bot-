// Página de manutenção. Por enquanto é standalone — não existe nenhum
// "modo manutenção" automático ligado a ela no restante do projeto (isso
// exigiria uma variável tipo MAINTENANCE_MODE=true checada no
// middleware/layout, que não existe hoje). Se quiser, dá pra ligar isso
// depois sem mexer em mais nada aqui.

export default function Manutencao() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber/15 text-amber flex items-center justify-center mx-auto mb-5">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4L14.7 6.3z" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-bold mb-2">Painel em manutenção</h1>
        <p className="text-muted text-sm">
          Estamos fazendo uma atualização rápida. Volta aqui daqui a pouco — o bot continua funcionando normalmente
          no Discord.
        </p>
      </div>
    </main>
  );
}
