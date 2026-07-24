import Link from "next/link";
import { Send, PiggyBank, Banknote, ArrowUpRight } from "lucide-react";

const ACTIONS = [
  { href: "/payments/transfer", label: "Send money", icon: Send },
  { href: "/payments/deposit", label: "Deposit", icon: PiggyBank },
  { href: "/payments/withdraw", label: "Withdraw", icon: Banknote },
];

export function QuickActions() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="group glass-card flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface-hover"
        >
          <span className="flex items-center gap-3">
            <action.icon className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">{action.label}</span>
          </span>
          <ArrowUpRight className="size-4 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
        </Link>
      ))}
    </div>
  );
}
