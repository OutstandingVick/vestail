/** What the circles mean. Shapes, not only colours: cannot-own is hatched. */
export function BoardLegend() {
  const item = (cls: string, label: string) => (
    <li className="flex items-center gap-1.5">
      <span aria-hidden="true" className={`size-3 rounded-full ${cls}`} />{label}
    </li>
  );
  return (
    <ul aria-label="Legend" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {item("bg-can", "Can own")}
      {item("bg-cond", "Licence, cap or condition")}
      {item("bg-cannot hatch", "Cannot own")}
    </ul>
  );
}
