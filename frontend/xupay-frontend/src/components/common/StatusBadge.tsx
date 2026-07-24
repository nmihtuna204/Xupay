import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "serious" | "error" | "info" | "violet" | "neutral";

const DOT: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  serious: "bg-[#ec835a]",
  error: "bg-error",
  info: "bg-primary",
  violet: "bg-[#9085e9]",
  neutral: "bg-muted-foreground",
};

/**
 * Restrained status indicator: a small colored dot + a plain text label
 * (never a heavy filled pill). The meaning is carried by the text, so the
 * dot is decorative reinforcement — colorblind-safe by construction.
 */
export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 whitespace-nowrap text-sm", className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", DOT[tone])} />
      <span className="capitalize">{label}</span>
    </span>
  );
}
