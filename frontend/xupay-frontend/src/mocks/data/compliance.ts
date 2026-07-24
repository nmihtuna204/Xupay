import { createRng, pick, randomInt, daysAgoISO, fullName } from "../seed";

export type SarStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "CLOSED";

export interface SarReport {
  id: string;
  reference: string;
  subjectName: string;
  reason: string;
  totalAmountCents: number;
  transactionCount: number;
  status: SarStatus;
  filedBy: string;
  createdAt: string;
  updatedAt: string;
}

const REASONS = [
  "Structuring / smurfing pattern",
  "Rapid movement of funds",
  "Transactions with high-risk jurisdiction",
  "Unusual for customer profile",
  "Possible third-party funding",
  "Layering through multiple wallets",
];

const ANALYSTS = ["A. Compliance", "R. Officer", "M. Reviewer", "T. Analyst"];
const STATUSES: SarStatus[] = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "CLOSED"];

export const sarReports: SarReport[] = (() => {
  const rng = createRng(0x5a12ce);
  return Array.from({ length: 120 }, (_, i) => {
    const createdAt = daysAgoISO(randomInt(rng, 0, 90), rng);
    return {
      id: `sar-${String(i).padStart(4, "0")}`,
      reference: `SAR-2026-${String(1000 + i)}`,
      subjectName: fullName(rng),
      reason: pick(rng, REASONS),
      totalAmountCents: randomInt(rng, 100_000, 20_000_000) * 100,
      transactionCount: randomInt(rng, 3, 60),
      status: pick(rng, STATUSES),
      filedBy: pick(rng, ANALYSTS),
      createdAt,
      updatedAt: createdAt,
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
})();

export function getSarReport(id: string): SarReport | undefined {
  return sarReports.find((r) => r.id === id);
}
