"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Painel geral", hash: "" },
  { href: "/dashboard#persona", label: "Persona", hash: "#persona" },
  { href: "/dashboard#boas-vindas", label: "Boas-vindas", hash: "#boas-vindas" },
  { href: "/dashboard#moderacao", label: "Moderação", hash: "#moderacao" },
  { href: "/dashboard#niveis", label: "Níveis (XP)", hash: "#niveis" },
  { href: "/dashboard/comandos", label: "Comandos personalizados", hash: "" },
];

export default function NavDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <nav className="relative w-72 max-w-[80%] h-full bg-surface border-r border-border p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display font-bold text-lg">Menu</span>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-surface-hover transition text-muted"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {LINKS.map((l) => {
                const active = pathname === l.href.split("#")[0] && !l.hash;
                return (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`px-3 py-2.5 rounded-lg text-sm transition ${
                      active ? "bg-accent text-white font-semibold" : "text-ink hover:bg-surface-hover"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
