import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { MarketingContentPage } from "@/components/MarketingContentPage";
import { MARKETING_PAGES, marketingPageKey } from "@/lib/marketing-pages";
import { absolute, SITE_NAME } from "@/lib/seo";

type PageProps = {
  params: Promise<{ section: string; slug: string }>;
};

export function generateStaticParams() {
  return Object.keys(MARKETING_PAGES).map(key => {
    const [section, slug] = key.split("/");
    return { section, slug };
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section, slug } = await params;
  const page = MARKETING_PAGES[marketingPageKey(section, slug)];
  if (!page) return {};
  const url = absolute(`/${section}/${slug}`);
  return {
    title: page.title,
    description: page.summary,
    alternates: { canonical: url },
    openGraph: { title: page.title, description: page.summary, url, type: "article", siteName: SITE_NAME },
    twitter: { card: "summary_large_image", title: page.title, description: page.summary },
  };
}

export default async function MarketingPageRoute({ params }: PageProps) {
  const { section, slug } = await params;
  const page = MARKETING_PAGES[marketingPageKey(section, slug)];

  if (!page) notFound();

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absolute("/") },
      { "@type": "ListItem", position: 2, name: page.section, item: absolute(`/${section}`) },
      { "@type": "ListItem", position: 3, name: page.title, item: absolute(`/${section}/${slug}`) },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <MarketingContentPage page={page} />
    </>
  );
}
