"use client";

import { useEffect, useState } from "react";

/** Light or dark, remembered on this device under the marketing site's key. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem("vestail-theme", next ? "dark" : "light"); } catch {}
  }

  return (
    <button type="button" onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={dark}
      className={`flex size-10 items-center justify-center rounded-full hover:bg-tint ${className}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
      </svg>
    </button>
  );
}
