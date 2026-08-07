"use client";

export default function Switch({ on, onChange, label, variant = "amber" }) {
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
