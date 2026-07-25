import Link from "next/link";
import { ArrowUpRight, Money, PaperPlaneTilt, PiggyBank } from "@phosphor-icons/react/dist/ssr";

const ACTIONS = [
  { href: "/payments/transfer", label: "PaperPlaneTilt money", icon: PaperPlaneTilt },
  { href: "/payments/deposit", label: "Deposit", icon: PiggyBank },
  { href: "/payments/withdraw", label: "Withdraw", icon: Money },
];

export function QuickActions() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="group panel flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface-hover"
        >
          <span className="flex items-center gap-3">
            <action.icon className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">{action.label}</span>
          </span>
          <ArrowUpRight weight="light" className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        </Link>
      ))}
    </div>
  );
}
