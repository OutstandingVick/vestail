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

  /*
   * A breadcrumb trail, so a result shows "vestail.fun › Supported countries"
   * rather than a bare URL.
   *
   * Two levels, not three. The obvious trail would be Home › Countries › this
   * page, but /countries, /company and /explore are not routes — they answer
   * 404. Every step but the last must carry a URL that resolves, and naming a
   * dead one teaches a crawler the markup cannot be trusted. The section
   * returns as a third level when those index pages exist.
   */
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absolute("/") },
      { "@type": "ListItem", position: 2, name: page.title, item: absolute(`/${section}/${slug}`) },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <MarketingContentPage page={page} />
    </>
  );
}
