export default function AdminLoading() {
  return (
    <div
      className="space-y-7 rounded-panel bg-canvas p-1"
      role="status"
      aria-label="Loading owner dashboard"
    >
      <div className="h-24 animate-pulse rounded-card bg-surface ring-1 ring-line" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-card bg-tint"
          />
        ))}
      </div>
    </div>
  );
}
