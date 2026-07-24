import { createRng, pick, randomInt, daysAgoISO, fullName } from "../seed";

export type AuditCategory = "AUTH" | "PAYMENT" | "WALLET" | "KYC" | "ADMIN";

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  category: AuditCategory;
  target: string;
  ipAddress: string;
  createdAt: string;
}

const EVENTS: { action: string; category: AuditCategory }[] = [
  { action: "User logged in", category: "AUTH" },
  { action: "User logged out", category: "AUTH" },
  { action: "Failed login attempt", category: "AUTH" },
  { action: "Transfer completed", category: "PAYMENT" },
  { action: "Deposit completed", category: "PAYMENT" },
  { action: "Withdrawal completed", category: "PAYMENT" },
  { action: "Wallet frozen", category: "WALLET" },
  { action: "Wallet unfrozen", category: "WALLET" },
  { action: "KYC document uploaded", category: "KYC" },
  { action: "KYC document approved", category: "KYC" },
  { action: "KYC document rejected", category: "KYC" },
  { action: "Limits updated", category: "ADMIN" },
];

function randomIp(rng: () => number): string {
  return `${randomInt(rng, 10, 220)}.${randomInt(rng, 0, 255)}.${randomInt(rng, 0, 255)}.${randomInt(rng, 1, 254)}`;
}

export const auditEntries: AuditEntry[] = (() => {
  const rng = createRng(0xa0d17);
  return Array.from({ length: 400 }, (_, i) => {
    const event = pick(rng, EVENTS);
    return {
      id: `audit-${String(i).padStart(4, "0")}`,
      actor: fullName(rng),
      action: event.action,
      category: event.category,
      target: `${randomInt(rng, 10000000, 99999999)}`,
      ipAddress: randomIp(rng),
      createdAt: daysAgoISO(randomInt(rng, 0, 90), rng),
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
})();
