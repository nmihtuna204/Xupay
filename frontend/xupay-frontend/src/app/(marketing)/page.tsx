import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, ScanEye, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Zap,
    title: "Instant transfers",
    description: "Idempotent, ledger-accurate transfers between wallets in real time.",
  },
  {
    icon: ScanEye,
    title: "Fraud detection",
    description: "Every transaction is scored and can be allowed, reviewed, or blocked automatically.",
  },
  {
    icon: ShieldCheck,
    title: "KYC & compliance",
    description: "Tiered verification with document upload, limits, and SAR reporting.",
  },
  {
    icon: BarChart3,
    title: "Full visibility",
    description: "Dashboards for balances, transaction history, and portfolio-wide analytics.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(circle_at_top,_var(--accent-from)/12%,_transparent_60%)]" />
        <div className="mx-auto max-w-4xl px-6 py-28 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            The wallet infrastructure for{" "}
            <span className="accent-gradient-text">modern payments</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-balance">
            XuPay is a ledger-accurate digital wallet platform — transfers, fraud detection, and
            compliance tooling built the way production fintech systems are actually built.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">
                Open an account <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="glass-card p-6">
              <feature.icon className="size-5 text-primary" />
              <h3 className="mt-4 font-medium">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
