"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNavigation, isNavItemActive } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex h-full w-[220px] flex-col border-r border-sidebar-border bg-sidebar px-3 py-5",
        className
      )}
    >
      <Link
        href="/dashboard"
        className="px-3 pb-2 text-sm font-semibold tracking-tight"
      >
        XuPay
      </Link>

      <div className="mt-7 flex flex-1 flex-col gap-6 overflow-y-auto">
        {mainNavigation.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
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
                        "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground",
                        active && "bg-white/[0.04] text-sidebar-foreground"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                      )}
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
