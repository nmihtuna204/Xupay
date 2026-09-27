import Link from "next/link";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh bg-background">
      {/*
        Floating glass pill, detached from the top edge rather than welded to
        it. Fixed, so the backdrop blur composites once instead of repainting
        with the page.
      */}
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-5">
        <nav className="flex w-full max-w-[1080px] items-center justify-between gap-6 rounded-full border border-glass-edge bg-[rgb(8_8_12/55%)] py-2 pl-5 pr-2 shadow-[var(--shadow-float)] backdrop-blur-xl">
          <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
            XuPay
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-body-foreground transition-colors duration-300 hover:text-foreground"
            >
              Sign in
            </Link>
            <Link href="/register" className="cta-primary cta-primary--sm">
              Open an account
            </Link>
          </div>
        </nav>
      </header>

      {children}
    </div>
  );
}
