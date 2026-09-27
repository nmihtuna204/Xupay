"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNavigation, isNavItemActive } from "@/config/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <nav
      className={cn(
        "flex h-full w-[220px] shrink-0 flex-col border-r border-hairline bg-sidebar px-3 py-5",
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
            <p className="px-3 pb-2 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.filter((item) => !item.adminOnly || isAdmin).map((item) => {
                const active = isNavItemActive(item, pathname);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      data-active={active}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors duration-300 hover:bg-white/[0.04] hover:text-foreground",
                        active &&
                          "bg-[rgb(91_91_240/12%)] text-foreground shadow-[inset_0_0_0_1px_rgb(91_91_240/22%)] [&>svg]:text-primary-accent"
                      )}
                    >
                      {active && (
                        // A gradient sliver rather than a solid bar: the
                        // brand light, once, in the app chrome.
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,var(--grad-fill-from),var(--grad-fill-to))]" />
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
