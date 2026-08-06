"use client";

import { signOut } from "next-auth/react";

export default function AccessDeniedActions() {
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition"
      >
        Sair da conta
      </button>
      <a
        href="/"
        className="px-4 py-2 rounded-lg border border-white/20 text-ink font-medium hover:bg-white/5 transition"
      >
        Voltar ao menu
      </a>
    </div>
  );
}
