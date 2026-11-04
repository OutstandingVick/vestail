import { Database } from "@phosphor-icons/react/dist/ssr";

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid min-h-52 place-items-center rounded-card bg-wash p-8 text-center ring-1 ring-line">
      <div>
        <Database className="mx-auto text-emphasis" size={30} weight="duotone" aria-hidden="true" />
        <h2 className="mt-3 text-lg font-bold">{title}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">{detail}</p>
      </div>
    </div>
  );
}
