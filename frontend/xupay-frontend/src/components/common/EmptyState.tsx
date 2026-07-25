import type { Icon as LucideIcon } from "@phosphor-icons/react";
import { Tray } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * The empty state for every list, table and collection in the app.
 *
 * Deliberately not a blank area with one grey line: an empty screen is the
 * first thing a new account sees, so it names what will appear here and offers
 * the action that fills it. The icon sits in a soft well rather than floating,
 * which keeps it from reading as a broken image.
 */
export function EmptyState({
  title,
  description,
  icon: Icon = Tray,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] px-6 py-14 text-center",
        className
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-white/[0.04]">
        <Icon weight="light" className="size-[18px] text-muted-foreground" />
      </div>
      <p className="mt-4 text-sm font-medium">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-[44ch] text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
