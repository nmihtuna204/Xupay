import { cn } from "@/lib/utils";

/**
 * Titled chart block.
 *
 * This used to be deliberately borderless, letting the chart breathe directly
 * on the page. That worked on the near-black surface, where the validated
 * series colours measured 5.0-6.3:1 against the background. It does not work
 * on the light system: sitting on the meshed app ground, aqua drops to 2.94:1
 * and yellow to 2.65:1, both under the 3:1 WCAG 1.4.11 asks of non-text
 * graphics.
 *
 * So the chart now sits on .panel - opaque white, where every series clears
 * 3:1 (see chart-colors.ts for the measurements). Opaque specifically, not
 * glass: a translucent container would let the mesh through and put the
 * palette right back under the bar. The container earns its keep here rather
 * than being decoration.
 */
export function ChartCard({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("panel p-5 sm:p-6", className)}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
