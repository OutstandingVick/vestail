import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { absolute } from "@/lib/seo";
import sections from "@/lib/privacy-content.json";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Vestail: how our information service works and your choices.",
  alternates: { canonical: absolute("/privacy") },
};

export default function Page() {
  return <LegalPage title="Privacy Policy" sections={sections} />;
}
