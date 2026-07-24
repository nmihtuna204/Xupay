import Link from "next/link";
import { Wallet } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <Link href="/" className="mb-10 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-from to-accent-to">
            <Wallet className="size-4 text-white" />
          </span>
          <span className="text-lg font-semibold tracking-tight">XuPay</span>
        </Link>
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-accent-from via-accent-from to-accent-to lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-16">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 max-w-md text-center text-white">
          <h2 className="text-3xl font-semibold tracking-tight">
            Bank-grade security for your digital transactions
          </h2>
          <p className="mt-4 text-white/80">
            Ledger-accurate transfers, real-time fraud detection, and full compliance
            tooling — built on the same architecture patterns used by production
            payment platforms.
          </p>
        </div>
      </div>
    </div>
  );
}
