import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mesh-bg relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/*
        Same pastel ground and dot field as the landing, so signing in feels
        like the same product rather than a separate utility screen. The old
        hairline grid and hard-coded black glow belonged to the dark system:
        white-on-light borders were invisible and the black shadow read as
        grime on a pastel ground.
      */}
      <div aria-hidden className="dot-field pointer-events-none absolute inset-0" />

      <div className="relative w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 block text-center text-sm font-semibold tracking-tight text-foreground"
        >
          XuPay
        </Link>

        {/* Nested enclosure: the form sits in a tray, not flat on the mesh. */}
        <div className="bezel">
          <div className="bezel-core--glass bezel-core p-7 sm:p-8">{children}</div>
        </div>

        <p className="mt-8 text-center text-xs tracking-wide text-muted-foreground">
          Ledger-accurate payments · fraud detection · compliance
        </p>
      </div>
    </div>
  );
}
