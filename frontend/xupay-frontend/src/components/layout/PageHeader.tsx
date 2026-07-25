/**
 * The single page-title treatment for the app group: title, thin description,
 * an action slot on the right, and a divider that separates header from body.
 *
 * Every (app) page renders this and nothing else as its heading, which is what
 * keeps the screens feeling like one product rather than nine pages.
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 border-b border-hairline pb-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="h-page">{title}</h1>
          {description && (
            <p className="mt-1.5 max-w-[68ch] text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}
