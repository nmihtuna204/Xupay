import { createRng, randomInt } from "../seed";

export interface AnalyticsOverview {
  totalVolumeCents: number;
  transactionCount: number;
  activeUsers: number;
  avgTransactionCents: number;
  volumeByDay: { date: string; volumeCents: number; count: number }[];
  volumeByType: { type: string; volumeCents: number }[];
  topCorridors: { corridor: string; volumeCents: number }[];
}

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

export function buildAnalytics(range: string): AnalyticsOverview {
  const days = RANGE_DAYS[range] ?? 30;
  const rng = createRng(0xa11a + days);

  const volumeByDay = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    // Weekend dip for a touch of realism.
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const base = weekend ? randomInt(rng, 40, 90) : randomInt(rng, 90, 180);
    return {
      date: d.toISOString().slice(0, 10),
      volumeCents: base * 1_000_00,
      count: base * randomInt(rng, 8, 14),
    };
  });

  const totalVolumeCents = volumeByDay.reduce((sum, d) => sum + d.volumeCents, 0);
  const transactionCount = volumeByDay.reduce((sum, d) => sum + d.count, 0);

  return {
    totalVolumeCents,
    transactionCount,
    activeUsers: randomInt(rng, 1_200, 4_800),
    avgTransactionCents: Math.round(totalVolumeCents / transactionCount),
    volumeByDay,
    volumeByType: [
      { type: "Transfer", volumeCents: Math.round(totalVolumeCents * 0.52) },
      { type: "Deposit", volumeCents: Math.round(totalVolumeCents * 0.28) },
      { type: "Withdrawal", volumeCents: Math.round(totalVolumeCents * 0.2) },
    ],
    topCorridors: [
      { corridor: "Personal → Personal", volumeCents: Math.round(totalVolumeCents * 0.44) },
      { corridor: "Personal → Merchant", volumeCents: Math.round(totalVolumeCents * 0.33) },
      { corridor: "Merchant → Personal", volumeCents: Math.round(totalVolumeCents * 0.15) },
      { corridor: "Escrow flows", volumeCents: Math.round(totalVolumeCents * 0.08) },
    ],
  };
}
