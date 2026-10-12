import { Database } from "@phosphor-icons/react/dist/ssr";

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="grid min-h-52 place-items-center rounded-card border border-dashed border-field bg-wash p-8 text-center"><div><Database className="mx-auto text-muted" size={28} aria-hidden="true" /><h2 className="mt-3 font-bold">{title}</h2><p className="mt-1 max-w-md text-sm leading-6 text-muted">{detail}</p></div></div>;
}
