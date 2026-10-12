import Link from "next/link";

import { Logo } from "@/components/Logo";

export function EarlyAccessShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#EBEBFF] text-[#17171A] [font-family:var(--font-outfit)]"><header className="mx-auto flex w-full max-w-6xl items-center px-5 py-6 sm:px-8"><Link href="/" aria-label="Vestail home" className="inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#17171A]"><Logo className="h-7 w-auto sm:h-8" /></Link></header><main>{children}</main><footer className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-3 px-5 py-8 text-sm text-[#66636d] sm:px-8"><span>© {new Date().getFullYear()} Vestail</span><span>Ownership starts with knowing the rules.</span></footer></div>;
}
