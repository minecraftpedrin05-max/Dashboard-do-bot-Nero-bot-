"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import NavDrawer from "./NavDrawer.jsx";
import StatCard from "./StatCard.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import GlobalSearch from "./GlobalSearch.jsx";
import Switch from "./Switch.jsx";
import {
  IconPing,
  IconClock,
  IconMemory,
  IconUsers,
  IconHash,
  IconShield,
  IconBoost,
  IconSmile,
  IconDb,
  IconBolt,
} from "./Icons.jsx";

function formatUptime(seconds) {
  if (seconds == null) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function pingTone(ping) {
  if (ping == null) return "default";
  if (ping < 150) return "success";
  if (ping < 350) return "amber";
  return "danger";
}

export default function DashboardClient({ userName }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState(null);

  const botName = process.env.NEXT_PUBLIC_BOT_NAME || "Meu Bot";

  function load() {
    fetch("/api/dashboard-data")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) return;
        setData(json);
        setForm((prev) => ({
          persona: json.settings.persona,
          welcome_channel_id: json.settings.welcome_channel_id || "",
          welcome_message: json.settings.welcome_message || "",
          mod_log_channel_id: json.settings.mod_log_channel_id || "",
          xp_enabled: !!json.settings.xp_enabled,
          ...(prev ? {} : {}),
        }));
      });
  }

  useEffect(() => {
    load();
    // Atualiza os stats (ping, uptime, memória...) periodicamente sem
    // interromper o que o admin está digitando nos campos de texto.
    const id = setInterval(() => {
      fetch("/api/dashboard-data")
        .then((r) => r.json())
        .then((json) => {
          if (json.error) return;
          setData(json);
        });
    }, 15000);
    return () => clearInterval(id);
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
      <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
        <div className="h-10 w-48 rounded-lg bg-surface animate-pulse mb-10" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-surface animate-pulse" />
          ))}
        </div>
        <div className="h-40 rounded-2xl bg-surface animate-pulse mb-4" />
        <div className="h-40 rounded-2xl bg-surface animate-pulse" />
      </main>
    );
  }

  const s = data.stats || {};

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <NavDrawer warningsCount={data.recentWarnings.length} />
          <span
            className="dot"
            style={{ background: data.online ? "#4ADE80" : "#F0575A" }}
            title={data.online ? "online" : "offline"}
          />
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
          <GlobalSearch />
          <Link
            href="/dashboard/comandos"
            className="text-sm text-ink border border-border rounded-lg px-3 py-1.5 hover:border-accent hover:text-accent transition hidden sm:inline-block"
          >
            Comandos
          </Link>
          <ThemeToggle />
          <span className="text-sm text-muted hidden sm:inline">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-white bg-danger/90 hover:bg-danger rounded-lg px-3 py-1.5 font-medium transition"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Grid de estatísticas em tempo real */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Ping"
          value={s.ping != null ? `${s.ping}ms` : "—"}
          tone={pingTone(s.ping)}
          icon={<IconPing className="w-[18px] h-[18px]" />}
        />
        <StatCard
          label="Uptime"
          value={formatUptime(s.uptimeSeconds)}
          icon={<IconClock className="w-[18px] h-[18px]" />}
        />
        <StatCard
          label="Memória"
          value={s.memoryUsedMb != null ? `${s.memoryUsedMb} MB` : "—"}
          icon={<IconMemory className="w-[18px] h-[18px]" />}
        />
        <StatCard
          label="Resposta API"
          value={s.responseMs != null ? `${s.responseMs}ms` : "—"}
          icon={<IconBolt className="w-[18px] h-[18px]" />}
        />
        <StatCard
          label="Membros"
          value={data.memberCount ?? "—"}
          icon={<IconUsers className="w-[18px] h-[18px]" />}
        />
        <StatCard
          label="Canais"
          value={s.channelCount ?? "—"}
          icon={<IconHash className="w-[18px] h-[18px]" />}
        />
        <StatCard
          label="Cargos"
          value={s.roleCount ?? "—"}
          icon={<IconShield className="w-[18px] h-[18px]" />}
        />
        <StatCard
          label="Emojis"
          value={s.emojiCount ?? "—"}
          icon={<IconSmile className="w-[18px] h-[18px]" />}
        />
        <StatCard
          label="Boosts"
          value={s.boostCount ?? "—"}
          icon={<IconBoost className="w-[18px] h-[18px]" />}
          tone={s.boostCount ? "amber" : "default"}
        />
        <StatCard
          label="Banco de dados"
          value={s.dbOnline ? "Online" : "Offline"}
          tone={s.dbOnline ? "success" : "danger"}
          icon={<IconDb className="w-[18px] h-[18px]" />}
        />
      </section>

      <section id="persona" className="bg-surface border border-border rounded-2xl p-6 mb-6 scroll-mt-6">
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

      <section id="boas-vindas" className="bg-surface border border-border rounded-2xl p-6 mb-6 scroll-mt-6">
        <h2 className="font-display text-lg font-semibold mb-4">Boas-vindas</h2>
        <label className="block text-sm text-muted mb-1">Canal</label>
        <select
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 mb-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
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
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
          rows={2}
          value={form.welcome_message}
          onChange={(e) => setForm({ ...form, welcome_message: e.target.value })}
          onBlur={(e) => save({ welcome_message: e.target.value })}
          placeholder="E aí {user}, bem-vindo!"
        />
      </section>

      <section id="moderacao" className="bg-surface border border-border rounded-2xl p-6 mb-6 scroll-mt-6">
        <h2 className="font-display text-lg font-semibold mb-4">Moderação</h2>
        <label className="block text-sm text-muted mb-1">Canal de log</label>
        <select
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 mb-5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
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
          <p className="text-sm text-muted font-mono border border-dashed border-border rounded-lg px-3 py-4 text-center">
            nenhum aviso ainda
          </p>
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

      <section id="niveis" className="bg-surface border border-border rounded-2xl p-6 scroll-mt-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Níveis (XP)</h2>
            <p className="text-muted text-sm mt-1">Membros ganham XP conversando no servidor.</p>
          </div>
          <Switch on={form.xp_enabled} onChange={(on) => save({ xp_enabled: on })} label="Ativar XP" />
        </div>

        {data.leaderboard.length > 0 ? (
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
        ) : (
          <p className="text-sm text-muted font-mono border border-dashed border-border rounded-lg px-3 py-4 text-center mt-4">
            ninguém no ranking ainda
          </p>
        )}
      </section>

      <p className="text-center text-xs text-muted font-mono mt-8" role="status" aria-live="polite">
        {error ? error : saving ? "salvando…" : savedAt ? `salvo às ${savedAt.toLocaleTimeString("pt-BR")}` : ""}
      </p>
    </main>
  );
}
