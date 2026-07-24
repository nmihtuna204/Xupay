import { cn } from "@/lib/utils";

/**
 * Titled chart block. Intentionally borderless and boxless — the chart
 * breathes on the page and is separated from siblings by whitespace, not a
 * card border. Only the title, description and optional action sit above it.
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
    <div className={cn(className)}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{title}</p>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
