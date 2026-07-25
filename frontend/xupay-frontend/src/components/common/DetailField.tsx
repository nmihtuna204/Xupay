/**
 * One key/value row in a detail panel. Uses the shared .field-label so a
 * detail key, a table header and a form label are the same treatment.
 */
export function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  /** Set for IDs, hashes and amounts, so glyphs align and digits do not jitter. */
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="field-label">{label}</p>
      <p
        className={
          mono
            ? "mt-1.5 truncate font-mono text-sm tabular-nums"
            : "mt-1.5 text-sm font-medium"
        }
      >
        {value}
      </p>
    </div>
  );
}
