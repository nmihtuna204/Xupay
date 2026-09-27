import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/*
        The landing's ground at rest: charcoal aperture, masked grid and the
        rings as a still image. No WebGL here - a sign-in screen should load
        instantly and hold still while someone types a password.
      */}
      <div aria-hidden className="aperture-glow absolute inset-0 -z-20" />
      <div aria-hidden className="grid-ground absolute inset-0 -z-10" />
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative still, sized in CSS */}
      <img
        src="/ring-fallback.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-[5] w-[min(1100px,140vw)] max-w-none -translate-x-1/2 -translate-y-[14%] opacity-70 [mask-image:linear-gradient(to_bottom,#000_35%,transparent_85%)]"
      />

      <div className="relative w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 block text-center text-sm font-semibold tracking-tight text-foreground"
        >
          XuPay
        </Link>

        <div className="glass-stage glass-stage--dense p-7 sm:p-8">{children}</div>

        <p className="mt-8 text-center text-xs tracking-wide text-muted-foreground">
          Ledger-accurate payments · fraud detection · compliance
        </p>
      </div>
    </div>
  );
}
