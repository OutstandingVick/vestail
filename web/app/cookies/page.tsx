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
  const rows = [
    ["vestail_profile", "Cookie", "Declared country and buyer type", "365 days; cleared on sign-out"],
    ["vestail_early_access", "Cookie", "Invitation authorization", "24 hours; removed on completion"],
    ["vestail-theme", "localStorage", "Appearance preference", "Until cleared"],
    ["vestail-consent-v1", "localStorage", "Consent categories and saved time", "180-day choice; key until replaced or cleared"],
    ...["privy:token", "privy:refresh_token", "privy:id_token", "privy:pat", "privy:connections", "privy:caid", "privy:code_verifier", "privy:state_code", "privy:headless_oauth", "privy:oauth_disable_signup"].map(name => [name, "SDK localStorage", "Privy authentication / wallet session", "SDK-managed; varies by sign-in flow"]),
    ["privy:__session_storage__test", "SDK localStorage", "Storage capability check", "Immediately removed"],
  ];
  return <LegalPage title="Cookie Policy" sections={sections}><div className="overflow-x-auto"><table className="w-full text-left"><caption className="mb-4 text-left font-bold">Confirmed storage inventory — all entries below are necessary</caption><thead><tr>{["Name", "Storage", "Purpose", "Category", "Duration"].map(label => <th key={label} scope="col" className="p-3">{label}</th>)}</tr></thead><tbody>{rows.map(([name, kind, purpose, duration]) => <tr key={name}><th scope="row" className="break-all p-3 font-medium">{name}</th><td className="p-3">{kind}</td><td className="p-3">{purpose}</td><td className="p-3">Necessary</td><td className="p-3">{duration}</td></tr>)}</tbody></table></div></LegalPage>;
}
