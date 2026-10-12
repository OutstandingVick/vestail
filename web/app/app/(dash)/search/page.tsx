import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Keep older shared search links working while Discover remains canonical. */
export default async function SearchRedirect({ searchParams }: { searchParams: SearchParams }) {
  const incoming = await searchParams;
  const query = new URLSearchParams();

  Object.entries(incoming).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(item => query.append(key, item));
    } else if (value !== undefined) {
      query.set(key, value);
    }
  });

  const suffix = query.toString();
  redirect(`/app/discover${suffix ? `?${suffix}` : ""}`);
}
