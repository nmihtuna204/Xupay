import { PageHeaderSkeleton, TableSkeleton } from "@/components/common/Skeletons";

/**
 * Route-transition fallback for the whole app group. Intentionally generic
 * (header plus one content block): it only shows during navigation, before the
 * segment knows which page it is. Per-query skeletons inside each page carry
 * the specific shape.
 */
export default function AppLoading() {
  return (
    <div className="page-stack">
      <PageHeaderSkeleton />
      <TableSkeleton />
    </div>
  );
}
