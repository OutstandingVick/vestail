"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

export interface ComboboxOption<T extends string> {
  value: T;
  /** Matched against the search text, case-insensitively. */
  searchText: string;
  /** How the option looks in the list. */
  row: ReactNode;
}

/**
 * A big, searchable, single-choice picker: the trigger shows the current
 * choice full-width; opening it gives a search field and a list.
 *
 * Accessibility: the search field is a combobox that owns the listbox
 * (aria-controls / aria-activedescendant), so screen readers announce the
 * highlighted option; arrows move, Enter picks, Escape closes and returns
 * focus to the trigger, Tab or a click outside closes it.
 */
export function Combobox<T extends string>({
  label,
  placeholder,
  searchPlaceholder,
  options,
  value,
  onChange,
  renderValue,
}: {
  label: string;
  placeholder: ReactNode;
  searchPlaceholder: string;
  options: ComboboxOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  renderValue: (value: T) => ReactNode;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.searchText.toLowerCase().includes(q)) : options;
  }, [options, query]);

  // Close on a pointer press outside the picker.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Focus the search field when the list opens. Resetting the search happens
  // in the click that opens it, not here: parents pass a fresh `options`
  // array on every render, so keying an effect on it would wipe the text
  // the user is typing.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function toggle() {
    if (!open) {
      setQuery("");
      setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    }
    setOpen((o) => !o);
  }

  function choose(option: ComboboxOption<T>) {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (matches[active]) choose(matches[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <p id={labelId} className="mb-2 text-sm font-semibold text-white/80">
        {label}
      </p>

      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={toggle}
        className="flex h-16 w-full items-center justify-between gap-3 rounded-2xl bg-white/[0.07] px-4 text-left text-lg font-semibold text-white ring-1 ring-white/10 transition-colors hover:bg-white/[0.1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
      >
        <span className="min-w-0 truncate">
          {value ? renderValue(value) : <span className="text-white/50">{placeholder}</span>}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className={`size-5 shrink-0 text-white/60 motion-safe:transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl bg-[#101631] shadow-2xl ring-1 ring-white/15">
          <div className="border-b border-white/10 p-2">
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={matches[active] ? `${id}-opt-${matches[active].value}` : undefined}
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              className="h-11 w-full rounded-xl bg-white/[0.06] px-3 text-base text-white outline-none placeholder:text-white/40 focus:ring-1 focus:ring-brand-orange"
            />
          </div>

          <ul id={listId} role="listbox" aria-labelledby={labelId} className="max-h-72 overflow-y-auto p-2">
            {matches.length === 0 && (
              <li className="px-3 py-4 text-sm text-white/60">No matches for “{query}”.</li>
            )}
            {matches.map((option, i) => (
              <li
                key={option.value}
                id={`${id}-opt-${option.value}`}
                role="option"
                aria-selected={option.value === value}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(option)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-white ${
                  i === active ? "bg-white/[0.09]" : ""
                }`}
              >
                <span className="min-w-0 flex-1">{option.row}</span>
                {option.value === value && (
                  <svg aria-hidden viewBox="0 0 20 20" className="size-4 shrink-0 text-brand-orange">
                    <path d="M4.5 10.5 8.5 14.5 15.5 6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
