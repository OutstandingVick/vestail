import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { IssuerStrip } from "@/components/landing/IssuerStrip";
import { LandingNav } from "@/components/landing/LandingNav";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { TrustSection } from "@/components/landing/TrustSection";

/**
 * Marketing landing page. The app itself lives at /app.
 *
 * The nav overlays the top of the full-bleed hero rather than pushing it
 * down, so the hero can own the whole first screen. The issuer strip is the
 * first thing under it: the hero makes a claim about versions of a stock,
 * and the strip names whose versions those are.
 */
export default function Landing() {
  return (
    <main className="relative flex-1">
      <div className="absolute inset-x-0 top-0 z-20">
        <LandingNav />
      </div>
      <Hero />
      <IssuerStrip />
      <ProblemSection />
      <HowItWorks />
      <TrustSection />
      <SiteFooter />
    </main>
  );
}
