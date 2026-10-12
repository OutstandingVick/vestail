"use client";

import { X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function PurchaseModal({ closeHref, children }: { closeHref: string; children: React.ReactNode }) {
  const router = useRouter();
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.replace(closeHref);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeHref, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onMouseDown={event => {
      if (event.target === event.currentTarget) router.replace(closeHref);
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="purchase-title" className="relative max-h-[calc(100vh-2rem)] w-full max-w-[460px] overflow-y-auto rounded-panel bg-surface shadow-2xl">
        <button ref={closeButton} type="button" onClick={() => router.replace(closeHref)} aria-label="Close purchase" className="absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-wash hover:bg-tint">
          <X size={20} weight="bold" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}
