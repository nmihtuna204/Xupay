export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export function paginate<T>(all: T[], url: URL): PagedResult<T> {
  const page = Number(url.searchParams.get("page") ?? 0);
  const size = Number(url.searchParams.get("size") ?? 10);
  const start = page * size;
  return {
    items: all.slice(start, start + size),
    total: all.length,
    page,
    size,
  };
}

/** Simulated backend latency so the showcase pages exercise real loading states. */
export function latency(): Promise<void> {
  return new Promise((r) => setTimeout(r, 300 + Math.random() * 300));
}
