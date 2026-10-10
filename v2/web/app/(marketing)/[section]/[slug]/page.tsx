import { notFound } from "next/navigation";

import { MarketingContentPage } from "@/components/MarketingContentPage";
import { MARKETING_PAGES, marketingPageKey } from "@/lib/marketing-pages";

type PageProps = {
  params: Promise<{ section: string; slug: string }>;
};

export default async function MarketingPageRoute({ params }: PageProps) {
  const { section, slug } = await params;
  const page = MARKETING_PAGES[marketingPageKey(section, slug)];

  if (!page) notFound();

  return <MarketingContentPage page={page} />;
}
