"use client";

import { useState } from "react";

/**
 * One UUID per form mount, reused across retries of the same submission
 * (e.g. the user double-clicks "Send" or a network blip triggers a retry).
 * A fresh key is only generated when the component remounts — which is
 * exactly the "new attempt" boundary we want for payments idempotency.
 *
 * useState's lazy initializer runs exactly once per mount and, unlike a
 * lazily-populated ref, doesn't read/write during render — so it's safe
 * under the React Compiler's refs rules.
 */
export function useIdempotencyKey(): string {
  const [key] = useState(() => crypto.randomUUID());
  return key;
}
