"use client";

import { useEffect, type ReactNode } from "react";

import { Icon } from "@/components/icons";

/**
 * A single toast at the bottom of the screen for the outcome of a purchase.
 * Success is announced politely and closes itself after a while; failures
 * are announced as alerts and stay until dismissed, since the buyer may need
 * to act on them. Slides in only under motion-safe.
 */
export function Toast({
  tone,
  children,
  onClose,
}: {
  tone: "success" | "error";
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (tone !== "success") return;
    const id = window.setTimeout(onClose, 8000);
    return () => window.clearTimeout(id);
  }, [tone, onClose]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3">
      <div
        role={tone === "error" ? "alert" : "status"}
        className={`pointer-events-auto flex w-full max-w-[480px] items-start gap-3 rounded-2xl bg-[#101631] px-4 py-3 text-sm text-white shadow-2xl ring-1 motion-safe:animate-[toast-in_200ms_ease-out] ${
          tone === "success" ? "ring-eligible/50" : "ring-restricted/50"
        }`}
      >
        <span
          aria-hidden
          className={`mt-1 size-2 shrink-0 rounded-full ${tone === "success" ? "bg-eligible" : "bg-restricted"}`}
        />
        <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="-m-1 rounded-md p-1 text-white/60 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-orange"
        >
          <Icon name="close" className="size-4" />
        </button>
      </div>
    </div>
  );
}
