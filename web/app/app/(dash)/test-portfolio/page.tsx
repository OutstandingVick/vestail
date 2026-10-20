import { notFound } from "next/navigation";

import { TestPortfolio } from "@/components/TestPortfolio";
import { TEST_MODE } from "@/lib/test-mode";

export default function TestPortfolioPage() {
  if (!TEST_MODE) notFound();
  return <TestPortfolio />;
}
