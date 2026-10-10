import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { MarketingContentPage } from "@/components/MarketingContentPage";
import { MARKETING_PAGES, marketingPageKey } from "@/lib/marketing-pages";

type PageProps = {
  params: Promise<{ section: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section, slug } = await params;
  const page = MARKETING_PAGES[marketingPageKey(section, slug)];
  if (!page) return {};
  return {
    title: `${page.title} · Vestail`,
    description: page.summary,
  };
}

export default async function MarketingPageRoute({ params }: PageProps) {
  const { section, slug } = await params;
  const page = MARKETING_PAGES[marketingPageKey(section, slug)];

  if (!page) notFound();

  return <MarketingContentPage page={page} />;
}
