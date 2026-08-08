"use client";

import { useEffect, useState } from "react";

function IconSun(p) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8 6 18M18 6l1.8-1.8" />
    </svg>
  );
}

function IconMoon(p) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
    </svg>
  );
}

export default function ThemeToggle() {
  // Começa null pra não renderizar um ícone "errado" antes de saber o tema
  // real (evita mismatch entre servidor e cliente).
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") || "dark");
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("nero-theme", next);
    setTheme(next);
  }

  if (!theme) return <div className="w-8 h-8" />;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
      title={theme === "light" ? "Tema escuro" : "Tema claro"}
      className="w-8 h-8 rounded-lg border border-border text-muted hover:text-ink hover:bg-surface-hover transition flex items-center justify-center shrink-0"
    >
      {theme === "light" ? <IconMoon /> : <IconSun />}
    </button>
  );
}
