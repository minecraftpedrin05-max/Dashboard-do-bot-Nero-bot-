"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch, IconX } from "./Icons.jsx";

// Índice estático das páginas/seções que já existem no dashboard.
// Cada módulo novo que for adicionado no futuro só precisa entrar
// nessa lista pra aparecer na busca.
const INDEX = [
  { label: "Visão geral", href: "/dashboard", group: "Painel" },
  { label: "Persona", href: "/dashboard#persona", group: "Configurações" },
  { label: "Boas-vindas", href: "/dashboard#boas-vindas", group: "Configurações" },
  { label: "Moderação", href: "/dashboard#moderacao", group: "Configurações" },
  { label: "Avisos recentes", href: "/dashboard#moderacao", group: "Logs" },
  { label: "Níveis (XP)", href: "/dashboard#niveis", group: "Configurações" },
  { label: "Ranking de XP", href: "/dashboard#niveis", group: "Logs" },
  { label: "Comandos personalizados", href: "/dashboard/comandos", group: "Ferramentas" },
  { label: "Configurações", href: "/dashboard/configuracoes", group: "Ferramentas" },
  { label: "Restaurar padrão", href: "/dashboard/configuracoes", group: "Ferramentas" },
  { label: "Logs", href: "/dashboard/logs", group: "Ferramentas" },
  { label: "Exportar logs", href: "/dashboard/logs", group: "Ferramentas" },
];

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e) {
      const isShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isShortcut) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INDEX;
    return INDEX.filter((i) => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q));
  }, [query]);

  function go(item) {
    setOpen(false);
    router.push(item.href);
  }

  function onKeyDownInput(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      go(results[activeIndex]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-muted border border-border rounded-lg px-3 py-1.5 hover:border-accent hover:text-ink transition"
      >
        <IconSearch className="w-4 h-4" />
        <span className="hidden sm:inline">Buscar</span>
        <kbd className="hidden sm:inline text-[10px] font-mono border border-border rounded px-1 py-0.5 ml-1">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <IconSearch className="w-4 h-4 text-muted shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onKeyDownInput}
                placeholder="Buscar configurações, comandos, páginas…"
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar busca"
                className="text-muted hover:text-ink transition"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto py-2">
              {results.length === 0 && (
                <p className="text-sm text-muted text-center py-6">Nada encontrado pra "{query}"</p>
              )}
              {results.map((item, i) => (
                <button
                  key={item.label + item.href}
                  type="button"
                  onClick={() => go(item)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center justify-between text-left px-4 py-2.5 text-sm transition ${
                    i === activeIndex ? "bg-accent text-white" : "text-ink hover:bg-surface-hover"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`text-xs font-mono ${i === activeIndex ? "text-white/70" : "text-muted"}`}>
                    {item.group}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
