import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-12 block text-center text-sm font-semibold tracking-tight"
        >
          XuPay
        </Link>

        {children}

        <p className="mt-12 text-center text-xs tracking-wide text-muted-foreground">
          Ledger-accurate payments · fraud detection · compliance
        </p>
      </div>
    </div>
  );
}
