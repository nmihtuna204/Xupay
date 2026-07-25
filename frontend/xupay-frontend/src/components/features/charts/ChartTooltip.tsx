"use client";

interface TooltipEntry {
  name?: unknown;
  value?: unknown;
  color?: string;
}

/**
 * Shared Recharts tooltip. Props are typed loosely to match Recharts 3's
 * readonly payload; identity is carried by a color swatch AND the series name
 * (never color alone). Callers pass `active`/`label`/`payload` explicitly
 * rather than spreading, since Recharts' own `formatter`/`labelFormatter`
 * props have different signatures than ours.
 */
export function ChartTooltip({
  active,
  label,
  payload,
  formatter,
  labelFormatter,
}: {
  active?: boolean;
  label?: unknown;
  payload?: readonly TooltipEntry[];
  formatter?: (value: number) => string;
  labelFormatter?: (label: string | number) => string;
}) {
  if (!active || !payload?.length) return null;

  const labelText =
    label === undefined || label === null
      ? undefined
      : labelFormatter && (typeof label === "string" || typeof label === "number")
        ? labelFormatter(label)
        : String(label);

  return (
    // Themed via tokens rather than inline colors: unlike the SVG chrome, the
    // tooltip is ordinary DOM, so it can just use the shared surface.
    <div className="rounded-lg border border-hairline bg-surface px-3 py-2 text-xs shadow-[var(--shadow-panel)]">
      {labelText !== undefined && (
        <p className="mb-1.5 font-medium text-foreground">{labelText}</p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-[2px]" style={{ background: entry.color }} />
              {String(entry.name ?? "")}
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {typeof entry.value === "number" && formatter
                ? formatter(entry.value)
                : String(entry.value ?? "")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
