import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { absolute } from "@/lib/seo";
import sections from "@/lib/terms-content.json";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Vestail: how our information service works and your choices.",
  alternates: { canonical: absolute("/terms") },
};

export default function Page() {
  return <LegalPage title="Terms of Service" sections={sections} />;
}
