import Link from "next/link";
import { Send, PiggyBank, Banknote } from "lucide-react";

const ACTIONS = [
  { href: "/payments/transfer", label: "Send money", icon: Send },
  { href: "/payments/deposit", label: "Deposit", icon: PiggyBank },
  { href: "/payments/withdraw", label: "Withdraw", icon: Banknote },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="glass-card flex flex-col items-center gap-2 px-4 py-5 text-center transition-colors hover:bg-surface-hover"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-from to-accent-to">
            <action.icon className="size-4 text-white" />
          </span>
          <span className="text-sm font-medium">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
