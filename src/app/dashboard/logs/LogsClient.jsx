"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NavDrawer from "../NavDrawer.jsx";
import ThemeToggle from "../ThemeToggle.jsx";
import GlobalSearch from "../GlobalSearch.jsx";

const TYPE_LABELS = {
  ban: "🔨 Ban",
  kick: "👢 Kick",
  mute: "🔇 Mute",
  warn: "⚠️ Aviso",
  autorole: "🎭 Autorole",
  reaction_role: "🎭 Reaction Role",
};

const inputClass =
  "bg-bg border border-border rounded-lg px-3 py-2 text-sm font-mono transition focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent";

export default function LogsClient() {
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (type) params.set("type", type);
    if (q) params.set("q", q);

    fetch(`/api/logs?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.error) setData(json);
        setLoading(false);
      });
  }, [type, q, page]);

  function exportCsv() {
    const params = new URLSearchParams({ export: "csv" });
    if (type) params.set("type", type);
    if (q) params.set("q", q);
    window.open(`/api/logs?${params}`, "_blank");
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <NavDrawer />
          <h1 className="font-display text-2xl font-bold">Logs</h1>
        </div>
        <div className="flex items-center gap-3">
          <GlobalSearch />
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="text-sm text-ink border border-border rounded-lg px-3 py-1.5 hover:border-accent hover:text-accent transition"
          >
            Voltar
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 mb-4">
        <select
          className={inputClass}
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos os tipos</option>
          {Object.entries(TYPE_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        <input
          className={inputClass + " flex-1 min-w-[160px]"}
          placeholder="Buscar por usuário ou motivo…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <button
          type="button"
          onClick={exportCsv}
          className="text-sm text-ink border border-border rounded-lg px-3 py-2 hover:border-accent hover:text-accent transition"
        >
          Exportar CSV
        </button>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 rounded-lg bg-bg animate-pulse" />
            ))}
          </div>
        ) : !data || data.rows.length === 0 ? (
          <p className="text-sm text-muted font-mono text-center py-10">nenhum registro encontrado</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted uppercase font-mono border-b border-border">
                <th className="px-4 py-3 font-medium">Quando</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Quem fez</th>
                <th className="px-4 py-3 font-medium">Alvo</th>
                <th className="px-4 py-3 font-medium">Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition">
                  <td className="px-4 py-3 text-muted font-mono whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{TYPE_LABELS[r.type] || r.type}</td>
                  <td className="px-4 py-3">{r.actor_tag || "—"}</td>
                  <td className="px-4 py-3">{r.target_tag || "—"}</td>
                  <td className="px-4 py-3 text-muted">{r.detail || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-sm border border-border rounded-lg px-3 py-1.5 disabled:opacity-40 hover:border-accent transition"
          >
            ← Anterior
          </button>
          <span className="text-sm text-muted font-mono">
            {data.page} de {data.pageCount}
          </span>
          <button
            type="button"
            disabled={page >= data.pageCount}
            onClick={() => setPage((p) => p + 1)}
            className="text-sm border border-border rounded-lg px-3 py-1.5 disabled:opacity-40 hover:border-accent transition"
          >
            Próxima →
          </button>
        </div>
      )}
    </main>
  );
}
