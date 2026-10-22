import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { absolute } from "@/lib/seo";
import sections from "@/lib/cookies-content.json";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookie Policy for Vestail: how our information service works and your choices.",
  alternates: { canonical: absolute("/cookies") },
};

export default function Page() {
  return <LegalPage title="Cookie Policy" sections={sections} />;
}
