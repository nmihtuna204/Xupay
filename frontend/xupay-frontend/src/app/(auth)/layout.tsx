import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Layered geometric depth: hairline grid field + a soft accent glow to
          the right. Replaces the old flat gradient side panel. */}
      <div aria-hidden className="bg-grid edge-fade pointer-events-none absolute inset-0 opacity-70" />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-1/2 -z-0 size-[60vmin] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--accent-from)_14%,transparent),transparent_70%)] blur-3xl"
      />

      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-sm font-semibold tracking-tight">
          XuPay
        </Link>

        {/* Elevated form surface floating over the grid field. */}
        <div className="rounded-2xl border border-white/[0.08] bg-surface/80 p-7 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:p-8">
          {children}
        </div>

        <p className="mt-8 text-center text-xs tracking-wide text-muted-foreground">
          Ledger-accurate payments · fraud detection · compliance
        </p>
      </div>
    </div>
  );
}
