"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

function Switch({ on, onChange, label, variant = "amber" }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      data-on={on}
      data-variant={variant}
      onClick={() => onChange(!on)}
      className="switch"
    >
      <span className="knob" />
    </button>
  );
}

export default function DashboardClient({ userName }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState(null);

  const botName = process.env.NEXT_PUBLIC_BOT_NAME || "Meu Bot";

  useEffect(() => {
    fetch("/api/dashboard-data")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) return;
        setData(json);
        setForm({
          persona: json.settings.persona,
          welcome_channel_id: json.settings.welcome_channel_id || "",
          welcome_message: json.settings.welcome_message || "",
          mod_log_channel_id: json.settings.mod_log_channel_id || "",
          xp_enabled: !!json.settings.xp_enabled,
        });
      });
  }, []);

  async function save(partial) {
    const next = { ...form, ...partial };
    setForm(next);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error("save failed");
      setSavedAt(new Date());
    } catch {
      setError("Não consegui salvar. Tenta de novo.");
    } finally {
      setSaving(false);
    }
  }

  if (!data || !form) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted font-mono text-sm">carregando…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-10 gap-4">
        <div className="flex items-center gap-3">
          <span className="dot" style={{ background: data.online ? "#4ADE80" : "#F0575A" }} />
          <div>
            <h1 className="font-display text-2xl font-bold leading-none">{botName}</h1>
            <p className="text-muted text-sm mt-1 font-mono">
              {data.online ? "online" : "offline"}
              {data.guildName ? ` · ${data.guildName}` : ""}
              {data.memberCount ? ` · ${data.memberCount} membros` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/comandos"
            className="text-sm text-ink border border-border rounded-lg px-3 py-1.5 hover:border-ink/30 transition"
          >
            Comandos
          </Link>
          <span className="text-sm text-muted hidden sm:inline">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-muted border border-border rounded-lg px-3 py-1.5 hover:text-ink hover:border-ink/30 transition"
          >
            Sair
          </button>
        </div>
      </header>

      <section className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Persona</h2>
            <p className="text-muted text-sm mt-1">
              {form.persona === "feminino" ? "Estilo mulher" : "Masculino"} — muda como o bot se refere a ele
              mesmo em algumas mensagens (boas-vindas, level up).
            </p>
          </div>
          <Switch
            on={form.persona === "feminino"}
            onChange={(on) => save({ persona: on ? "feminino" : "masculino" })}
            label="Alternar persona"
            variant="rose"
          />
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-display text-lg font-semibold mb-4">Boas-vindas</h2>
        <label className="block text-sm text-muted mb-1">Canal</label>
        <select
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 mb-4 font-mono text-sm"
          value={form.welcome_channel_id}
          onChange={(e) => save({ welcome_channel_id: e.target.value })}
        >
          <option value="">Desativado</option>
          {data.channels.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.name}
            </option>
          ))}
        </select>
        <label className="block text-sm text-muted mb-1">
          Mensagem (use {"{user}"} pra mencionar quem entrou)
        </label>
        <textarea
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm"
          rows={2}
          value={form.welcome_message}
          onChange={(e) => setForm({ ...form, welcome_message: e.target.value })}
          onBlur={(e) => save({ welcome_message: e.target.value })}
          placeholder="E aí {user}, bem-vindo!"
        />
      </section>

      <section className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-display text-lg font-semibold mb-4">Moderação</h2>
        <label className="block text-sm text-muted mb-1">Canal de log</label>
        <select
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 mb-5 font-mono text-sm"
          value={form.mod_log_channel_id}
          onChange={(e) => save({ mod_log_channel_id: e.target.value })}
        >
          <option value="">Desativado</option>
          {data.channels.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.name}
            </option>
          ))}
        </select>

        <p className="text-sm text-muted mb-2">Avisos recentes</p>
        {data.recentWarnings.length === 0 ? (
          <p className="text-sm text-muted font-mono">nenhum aviso ainda</p>
        ) : (
          <ul className="space-y-2">
            {data.recentWarnings.map((w) => (
              <li key={w.id} className="text-sm border-l-2 border-danger pl-3">
                <span className="text-ink">{w.userTag}</span>
                <span className="text-muted"> — {w.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Níveis (XP)</h2>
            <p className="text-muted text-sm mt-1">Membros ganham XP conversando no servidor.</p>
          </div>
          <Switch on={form.xp_enabled} onChange={(on) => save({ xp_enabled: on })} label="Ativar XP" />
        </div>

        {data.leaderboard.length > 0 && (
          <ol className="space-y-1.5 mt-4">
            {data.leaderboard.map((row, i) => (
              <li key={row.user_id} className="text-sm flex justify-between font-mono">
                <span>
                  {i + 1}. {row.userTag}
                </span>
                <span className="text-muted">
                  nv {row.level} · {row.xp} xp
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="text-center text-xs text-muted font-mono mt-8">
        {error ? error : saving ? "salvando…" : savedAt ? `salvo às ${savedAt.toLocaleTimeString("pt-BR")}` : ""}
      </p>
    </main>
  );
}
