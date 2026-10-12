import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { DiscoverPageContent, type DiscoverPageProps } from "@/components/DiscoverPageContent";

export default async function DiscoverAssetPage({ params, searchParams }: {
  params: Promise<{ asset: string; name: string }>;
  searchParams: DiscoverPageProps["searchParams"];
}) {
  const { asset, name } = await params;
  const incoming = await searchParams;
  const basePath = `/app/discover/${encodeURIComponent(asset)}/${encodeURIComponent(name)}`;

  return (
    <>
      <Link href="/app/discover" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-line bg-surface px-4 font-semibold hover:border-field hover:bg-wash">
        <ArrowLeft size={18} weight="bold" aria-hidden="true" />
        Back to Discover
      </Link>
      <DiscoverPageContent searchParams={Promise.resolve({ ...incoming, q: name })} showExplorer={false} boardBasePath={basePath} />
    </>
  );
}
