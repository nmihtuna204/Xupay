import Link from "next/link";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh bg-background">
      {/* Thin, transparent overlay header — floats over the cinematic sections. */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            XuPay
          </Link>
          <nav className="flex items-center gap-6 text-xs font-medium uppercase tracking-[0.1em]">
            <Link
              href="/login"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-foreground px-4 py-2 text-background transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
