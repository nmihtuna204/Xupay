"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { mainNavigation, isNavItemActive } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4",
        className
      )}
    >
      <Link href="/dashboard" className="flex items-center gap-2 px-2 py-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-from to-accent-to">
          <Wallet className="size-4 text-white" />
        </span>
        <span className="text-lg font-semibold tracking-tight">XuPay</span>
      </Link>

      <div className="mt-6 flex flex-1 flex-col gap-5 overflow-y-auto">
        {mainNavigation.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isNavItemActive(item, pathname);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      data-active={active}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        active &&
                          "bg-sidebar-accent text-sidebar-foreground"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
