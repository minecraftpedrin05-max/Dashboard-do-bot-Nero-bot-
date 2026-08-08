"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconHeart,
  IconGift,
  IconShield,
  IconBolt,
  IconTerminal,
  IconSearch,
  IconX,
  IconSettings,
} from "./Icons.jsx";

// Ícone simples de lista/log, só usado aqui
const IconList = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);

// Itens agrupados por categoria. "hash" identifica seções dentro de
// /dashboard; itens sem hash são páginas próprias.
const GROUPS = [
  {
    label: "Painel",
    items: [
      { href: "/dashboard", label: "Visão geral", hash: "", icon: IconHome },
      { href: "/dashboard#persona", label: "Persona", hash: "#persona", icon: IconHeart },
      { href: "/dashboard#boas-vindas", label: "Boas-vindas", hash: "#boas-vindas", icon: IconGift },
      { href: "/dashboard#moderacao", label: "Moderação", hash: "#moderacao", icon: IconShield, badgeKey: "warnings" },
      { href: "/dashboard#niveis", label: "Níveis (XP)", hash: "#niveis", icon: IconBolt },
    ],
  },
  {
    label: "Ferramentas",
    items: [
      { href: "/dashboard/comandos", label: "Comandos personalizados", hash: "", icon: IconTerminal },
      { href: "/dashboard/configuracoes", label: "Configurações", hash: "", icon: IconSettings },
      { href: "/dashboard/logs", label: "Logs", hash: "", icon: IconList },
    ],
  },
];

export default function NavDrawer({ warningsCount }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = usePathname();

  const badges = { warnings: warningsCount };

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.label.toLowerCase().includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menu"
        onClick={() => setOpen(true)}
        className="flex flex-col justify-center gap-[5px] w-9 h-9 rounded-lg hover:bg-surface-hover transition shrink-0"
      >
        <span className="block h-[2px] w-5 bg-ink mx-auto rounded-full" />
        <span className="block h-[2px] w-5 bg-ink mx-auto rounded-full" />
        <span className="block h-[2px] w-5 bg-ink mx-auto rounded-full" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={close} />
          <nav className="relative w-72 max-w-[80%] h-full bg-surface border-r border-border p-5 flex flex-col animate-[slidein_.15s_ease]">
            <div className="flex items-center justify-between mb-4">
              <span className="font-display font-bold text-lg">Menu</span>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={close}
                className="w-8 h-8 rounded-lg hover:bg-surface-hover transition text-muted flex items-center justify-center"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <label className="relative mb-5 shrink-0">
              <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar no menu…"
                className="w-full bg-bg border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
              />
            </label>

            <div className="flex flex-col gap-5 overflow-y-auto">
              {filteredGroups.length === 0 && (
                <p className="text-sm text-muted text-center py-6">Nada encontrado pra "{query}"</p>
              )}
              {filteredGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-xs uppercase tracking-wide text-muted font-mono mb-1.5 px-1">
                    {group.label}
                  </p>
                  <div className="flex flex-col gap-1">
                    {group.items.map((l) => {
                      const Icon = l.icon;
                      const active = pathname === l.href.split("#")[0] && !l.hash;
                      const badge = l.badgeKey ? badges[l.badgeKey] : null;
                      return (
                        <Link
                          key={l.label}
                          href={l.href}
                          onClick={close}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition ${
                            active ? "bg-accent text-white font-semibold" : "text-ink hover:bg-surface-hover"
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-muted"}`} />
                          <span className="flex-1">{l.label}</span>
                          {!!badge && (
                            <span
                              className={`text-[11px] font-mono rounded-full px-1.5 py-0.5 leading-none ${
                                active ? "bg-white/20 text-white" : "bg-danger/15 text-danger"
                              }`}
                            >
                              {badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
