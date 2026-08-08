"use client";

// Card de estatística reutilizável. Usado na grid do topo do dashboard
// (ping, uptime, memória, membros, cargos, canais, emojis, boosts...).
//
// tone controla a cor do valor/ícone: "default" | "success" | "danger" | "amber"

const TONE_TEXT = {
  default: "text-ink",
  success: "text-success",
  danger: "text-danger",
  amber: "text-amber",
};

export default function StatCard({ label, value, hint, icon, tone = "default", loading }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2 transition hover:border-accent/40 hover:bg-surface-hover">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted font-mono">{label}</span>
        {icon && <span className="text-muted/80 shrink-0" aria-hidden="true">{icon}</span>}
      </div>
      {loading ? (
        <div className="h-6 w-16 rounded-md bg-border/70 animate-pulse" />
      ) : (
        <span className={`font-display text-xl font-bold leading-none ${TONE_TEXT[tone]}`}>
          {value ?? "—"}
        </span>
      )}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}
