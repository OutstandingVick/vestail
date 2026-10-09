"use client";

import { CircleHalf } from "@phosphor-icons/react";
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
      <CircleHalf size={18} weight={dark ? "fill" : "regular"} aria-hidden="true" />
    </button>
  );
}
