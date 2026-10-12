export default function AdminLoading() {
  return <div className="space-y-7" role="status" aria-label="Loading owner dashboard"><div className="h-24 animate-pulse rounded-card bg-tint" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-card bg-tint" />)}</div></div>;
}
