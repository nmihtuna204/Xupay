/**
 * A tiny deterministic PRNG (mulberry32) so every mock dataset is identical
 * across reloads and test runs — the showcase pages must look the same each
 * time, and tests need stable data to assert against.
 */
export function createRng(seed: number) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** ISO timestamp `daysAgo` days before now, at a deterministic-ish time. */
export function daysAgoISO(daysAgo: number, rng: () => number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(randomInt(rng, 0, 23), randomInt(rng, 0, 59), 0, 0);
  return d.toISOString();
}

const FIRST_NAMES = [
  "Minh", "Linh", "An", "Huy", "Thao", "Nam", "Mai", "Duc", "Ha", "Trang",
  "Olivia", "Liam", "Emma", "Noah", "Ava", "Lucas", "Sofia", "Ethan",
];
const LAST_NAMES = [
  "Nguyen", "Tran", "Le", "Pham", "Hoang", "Vu", "Dang", "Bui",
  "Smith", "Johnson", "Garcia", "Kim", "Chen", "Patel",
];

export function fullName(rng: () => number): string {
  return `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
}
