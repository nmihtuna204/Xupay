import { createRng, pick, randomInt, daysAgoISO, fullName } from "../seed";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type FraudAction = "ALLOW" | "REVIEW" | "BLOCK";

export interface FraudAlert {
  id: string;
  transactionId: string;
  userName: string;
  amountCents: number;
  riskScore: number;
  riskLevel: RiskLevel;
  action: FraudAction;
  ruleTriggered: string;
  createdAt: string;
}

const RULES = [
  "Velocity: >5 transfers in 10 min",
  "Amount anomaly vs 30-day average",
  "New device + high-value transfer",
  "Geo mismatch (login vs transfer)",
  "Structuring pattern detected",
  "Recipient on internal watchlist",
  "Dormant account sudden activity",
];

function levelFor(score: number): RiskLevel {
  if (score >= 85) return "CRITICAL";
  if (score >= 65) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

function actionFor(level: RiskLevel): FraudAction {
  if (level === "CRITICAL") return "BLOCK";
  if (level === "HIGH") return "REVIEW";
  if (level === "MEDIUM") return "REVIEW";
  return "ALLOW";
}

export const fraudAlerts: FraudAlert[] = (() => {
  const rng = createRng(0xf1a11d);
  return Array.from({ length: 240 }, (_, i) => {
    const riskScore = randomInt(rng, 5, 99);
    const riskLevel = levelFor(riskScore);
    return {
      id: `fraud-${String(i).padStart(4, "0")}`,
      transactionId: `${randomInt(rng, 10000000, 99999999)}`,
      userName: fullName(rng),
      amountCents: randomInt(rng, 5_000, 5_000_000) * 100,
      riskScore,
      riskLevel,
      action: actionFor(riskLevel),
      ruleTriggered: pick(rng, RULES),
      createdAt: daysAgoISO(randomInt(rng, 0, 90), rng),
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
})();

export interface FraudMetrics {
  totalEvaluated: number;
  flagged: number;
  blocked: number;
  falsePositiveRate: number;
  byLevel: { level: RiskLevel; count: number }[];
  trend: { date: string; flagged: number; blocked: number }[];
}

export const fraudMetrics: FraudMetrics = (() => {
  const rng = createRng(0xf1a12e);
  const byLevel = (["LOW", "MEDIUM", "HIGH", "CRITICAL"] as RiskLevel[]).map((level) => ({
    level,
    count: fraudAlerts.filter((a) => a.riskLevel === level).length,
  }));
  const trend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      date: d.toISOString().slice(0, 10),
      flagged: randomInt(rng, 8, 40),
      blocked: randomInt(rng, 1, 12),
    };
  });
  return {
    totalEvaluated: 18_432,
    flagged: fraudAlerts.length,
    blocked: fraudAlerts.filter((a) => a.action === "BLOCK").length,
    falsePositiveRate: 0.037,
    byLevel,
    trend,
  };
})();
