import { Hero } from "@/components/landing/Hero";
import { LandingNav } from "@/components/landing/LandingNav";

/**
 * Marketing landing page. The app itself lives at /app.
 *
 * The nav overlays the top of the full-bleed hero rather than pushing it
 * down, so the hero can own the whole first screen.
 */
export default function Landing() {
  return (
    <main className="relative flex-1">
      <div className="absolute inset-x-0 top-0 z-20">
        <LandingNav />
      </div>
      <Hero />
    </main>
  );
}
