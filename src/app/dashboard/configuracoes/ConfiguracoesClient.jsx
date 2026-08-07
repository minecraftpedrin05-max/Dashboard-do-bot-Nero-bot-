"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import NavDrawer from "../NavDrawer.jsx";
import ThemeToggle from "../ThemeToggle.jsx";
import GlobalSearch from "../GlobalSearch.jsx";
import Switch from "../Switch.jsx";
import { IconSearch } from "../Icons.jsx";

// Mesmos valores padrão definidos no schema do banco (guild_settings),
// usados pelo botão "Restaurar padrão".
const DEFAULT_SETTINGS = {
  persona: "masculino",
  welcome_channel_id: "",
  welcome_message: "",
  mod_log_channel_id: "",
  xp_enabled: true,
};

const inputClass =
  "w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm font-mono transition focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent";

function Option({ title, description, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-border last:border-0">
      <div className="max-w-[60%]">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
      </div>
      <div className="w-48 shrink-0">{children}</div>
    </div>
  );
}

export default function ConfiguracoesClient() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState(null);

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

  function restoreDefaults() {
    if (!window.confirm("Restaurar todas as configurações pro padrão? Isso apaga persona, boas-vindas e canal de log configurados.")) {
      return;
    }
    save(DEFAULT_SETTINGS);
  }

  const categories = useMemo(() => {
    if (!data || !form) return [];
    return [
      {
        id: "persona",
        label: "Persona",
        match: "persona estilo genero",
        content: (
          <Option
            title="Estilo de fala"
            description="Muda como o bot se refere a ele mesmo em boas-vindas e level up."
          >
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-muted">{form.persona === "feminino" ? "Feminino" : "Masculino"}</span>
              <Switch
                on={form.persona === "feminino"}
                onChange={(on) => save({ persona: on ? "feminino" : "masculino" })}
                label="Alternar persona"
                variant="rose"
              />
            </div>
          </Option>
        ),
      },
      {
        id: "boas-vindas",
        label: "Boas-vindas",
        match: "boas vindas welcome canal mensagem",
        content: (
          <>
            <Option title="Canal de boas-vindas" description="Onde a mensagem é enviada quando alguém entra.">
              <select
                className={inputClass}
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
            </Option>
            <Option title="Mensagem" description={`Use {user} pra mencionar quem entrou.`}>
              <textarea
                className={inputClass}
                rows={2}
                value={form.welcome_message}
                onChange={(e) => setForm({ ...form, welcome_message: e.target.value })}
                onBlur={(e) => save({ welcome_message: e.target.value })}
                placeholder="E aí {user}, bem-vindo!"
              />
            </Option>
          </>
        ),
      },
      {
        id: "moderacao",
        label: "Moderação",
        match: "moderacao log avisos warn",
        content: (
          <Option title="Canal de log" description="Onde avisos e ações de moderação são registrados.">
            <select
              className={inputClass}
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
          </Option>
        ),
      },
      {
        id: "niveis",
        label: "Níveis (XP)",
        match: "niveis xp nivel ranking",
        content: (
          <Option title="Sistema de XP" description="Membros ganham XP conversando no servidor.">
            <div className="flex justify-end">
              <Switch on={form.xp_enabled} onChange={(on) => save({ xp_enabled: on })} label="Ativar XP" />
            </div>
          </Option>
        ),
      },
    ];
  }, [data, form]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.label.toLowerCase().includes(q) || c.match.includes(q));
  }, [categories, query]);

  if (!data || !form) {
    return (
      <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
        <div className="h-10 w-56 rounded-lg bg-surface animate-pulse mb-8" />
        <div className="h-64 rounded-2xl bg-surface animate-pulse" />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <NavDrawer warningsCount={data.recentWarnings?.length} />
          <h1 className="font-display text-2xl font-bold">Configurações</h1>
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

      <label className="relative block mb-6">
        <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar uma configuração…"
          className={inputClass + " pl-9"}
        />
      </label>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted text-center py-10">Nenhuma configuração encontrada pra "{query}"</p>
      ) : (
        filtered.map((cat) => (
          <section key={cat.id} className="bg-surface border border-border rounded-2xl p-6 mb-4">
            <h2 className="font-display text-lg font-semibold mb-1">{cat.label}</h2>
            <div>{cat.content}</div>
          </section>
        ))
      )}

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <button
          type="button"
          onClick={restoreDefaults}
          className="text-sm text-danger hover:bg-danger/10 rounded-lg px-3 py-1.5 transition"
        >
          Restaurar padrão
        </button>
        <p className="text-xs text-muted font-mono" role="status" aria-live="polite">
          {error ? error : saving ? "salvando…" : savedAt ? `salvo às ${savedAt.toLocaleTimeString("pt-BR")}` : ""}
        </p>
      </div>
    </main>
  );
}
