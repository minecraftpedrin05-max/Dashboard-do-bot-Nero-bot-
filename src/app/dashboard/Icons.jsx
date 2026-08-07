// Ícones SVG simples, inline, sem adicionar nenhuma dependência nova ao
// projeto (evita mexer no package.json / instalação no Railway).
// Todos aceitam className para herdar cor/tamanho via Tailwind.

const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const IconPing = (p) => (
  <svg {...base} {...p}>
    <path d="M4 12h4l2-7 4 14 2-7h4" />
  </svg>
);

export const IconClock = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

export const IconMemory = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M9 4v16M15 4v16M4 9h16M4 15h16" />
  </svg>
);

export const IconUsers = (p) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
    <circle cx="17" cy="8" r="2.6" />
    <path d="M17 5.2c1.7.4 3 1.9 3 3.8 0 1.5-.8 2.8-2 3.4" />
  </svg>
);

export const IconHash = (p) => (
  <svg {...base} {...p}>
    <path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16" />
  </svg>
);

export const IconShield = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
  </svg>
);

export const IconBoost = (p) => (
  <svg {...base} {...p}>
    <path d="M12 2l3.5 6.5L22 9l-5 4.8 1.3 7.2L12 17.5 5.7 21l1.3-7.2L2 9l6.5-.5z" />
  </svg>
);

export const IconSmile = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
  </svg>
);

export const IconDb = (p) => (
  <svg {...base} {...p}>
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
    <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
  </svg>
);

export const IconBolt = (p) => (
  <svg {...base} {...p}>
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
  </svg>
);

export const IconHome = (p) => (
  <svg {...base} {...p}>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10v10h12V10" />
  </svg>
);

export const IconSearch = (p) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const IconTerminal = (p) => (
  <svg {...base} {...p}>
    <path d="m5 7 5 5-5 5" />
    <path d="M13 17h6" />
  </svg>
);

export const IconHeart = (p) => (
  <svg {...base} {...p}>
    <path d="M12 20s-7-4.4-9.5-9C.8 7.4 2.4 4 6 4c2 0 3.5 1.2 4 2.5.5-1.3 2-2.5 4-2.5 3.6 0 5.2 3.4 3.5 7-2.5 4.6-9.5 9-9.5 9z" />
  </svg>
);

export const IconGift = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="9" width="16" height="11" rx="1" />
    <path d="M4 9V6a2 2 0 0 1 2-2c2 0 3 2 4 3.5C11 6 12 4 14 4a2 2 0 0 1 2 2v3M12 4v16" />
  </svg>
);

export const IconX = (p) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconSettings = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13a7.5 7.5 0 0 0 0-2l2-1.5-2-3.4-2.4.8a7.4 7.4 0 0 0-1.7-1L15 3h-6l-.3 2.5a7.4 7.4 0 0 0-1.7 1l-2.4-.8-2 3.4L4.6 11a7.5 7.5 0 0 0 0 2l-2 1.5 2 3.4 2.4-.8a7.4 7.4 0 0 0 1.7 1L9 21h6l.3-2.5a7.4 7.4 0 0 0 1.7-1l2.4.8 2-3.4z" />
  </svg>
);
