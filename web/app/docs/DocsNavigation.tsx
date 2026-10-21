"use client";

import { useEffect, useState } from "react";

import styles from "./docs.module.css";

export function DocsNavigation({ items }: { items: { label: string; href: string }[] }) {
  const [active, setActive] = useState(items[0]?.href);

  useEffect(() => {
    let frame = 0;
    const fromHash = () => {
      if (items.some(item => item.href === window.location.hash)) {
        setActive(window.location.hash);
      }
    };
    const fromScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let current = items[0]?.href;
        for (const item of items) {
          const section = document.getElementById(item.href.slice(1));
          if (section && section.getBoundingClientRect().top <= 180) current = item.href;
        }
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
          current = items.at(-1)?.href ?? current;
        }
        setActive(current);
      });
    };
    fromHash();
    if (!window.location.hash) fromScroll();
    window.addEventListener("hashchange", fromHash);
    window.addEventListener("scroll", fromScroll, { passive: true });
    window.addEventListener("resize", fromScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", fromHash);
      window.removeEventListener("scroll", fromScroll);
      window.removeEventListener("resize", fromScroll);
    };
  }, [items]);

  return <nav aria-label="Documentation sections">
    {items.map(item => <a key={item.href} href={item.href}
      className={active === item.href ? styles.activeLink : undefined}
      aria-current={active === item.href ? "location" : undefined}
      onClick={() => setActive(item.href)}>{item.label}</a>)}
  </nav>;
}
