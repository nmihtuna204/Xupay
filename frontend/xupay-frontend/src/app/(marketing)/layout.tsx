import Link from "next/link";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh bg-background">
      {/*
        Film grain. A single fixed layer rather than one inside the scrolling
        content: an absolutely-positioned noise tile in a scroll container
        repaints every frame, which is the one thing a grain overlay must not
        do. Very low opacity on light - the same value that reads as texture on
        near-black reads as dirt on near-white.
      */}
      <div
        aria-hidden
        className="noise-overlay pointer-events-none fixed inset-0 z-[60] opacity-[0.025]"
      />

      {/*
        Floating glass pill, detached from the top edge rather than welded to
        it. Fixed, so the backdrop blur composites once instead of repainting
        with the page.
      */}
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-5">
        <nav className="glass-card flex w-full max-w-[1080px] items-center justify-between gap-6 rounded-full px-5 py-2.5">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            XuPay
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-body-foreground transition-colors duration-300 hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="accent-gradient-fill rounded-full px-5 py-2 text-sm font-medium shadow-[var(--shadow-soft)] transition-transform duration-500 ease-[var(--ease-island)] active:scale-[0.98]"
            >
              Open an account
            </Link>
          </div>
        </nav>
      </header>

      {children}
    </div>
  );
}
