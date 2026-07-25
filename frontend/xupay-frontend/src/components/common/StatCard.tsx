import type { Icon as LucideIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * A single metric in a panel.
 *
 * `emphasis` exists so a stat row can carry a hierarchy instead of four
 * identical tiles: one lead figure anchors the page and the rest support it.
 * Four equal cards is the default that makes a dashboard look generated.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  emphasis = "secondary",
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  tone?: "default" | "success" | "warning" | "critical";
  emphasis?: "primary" | "secondary";
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    critical: "text-error",
  }[tone];

  const primary = emphasis === "primary";

  return (
    <div className={cn("panel", primary ? "p-6" : "p-panel")}>
      <div className="flex items-center justify-between gap-3">
        <p className="field-label truncate">{label}</p>
        {Icon && <Icon weight="light" className="size-4 shrink-0 text-muted-foreground" />}
      </div>
      <p
        className={cn(
          "figure-lg mt-2.5",
          primary ? "text-[clamp(1.75rem,3vw,2.25rem)]" : "text-xl",
          toneClass
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
