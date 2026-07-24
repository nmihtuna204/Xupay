import { describe, expect, it } from "vitest";
import { createRng } from "../seed";
import { fraudAlerts, fraudMetrics } from "./fraud";
import { sarReports } from "./compliance";
import { auditEntries } from "./audit-log";
import { buildAnalytics } from "./analytics";

describe("deterministic seed", () => {
  it("produces the same sequence for the same seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("fraud fixtures", () => {
  it("derives a risk level consistent with the score", () => {
    for (const alert of fraudAlerts) {
      if (alert.riskScore >= 85) expect(alert.riskLevel).toBe("CRITICAL");
      else if (alert.riskScore >= 65) expect(alert.riskLevel).toBe("HIGH");
      else if (alert.riskScore >= 40) expect(alert.riskLevel).toBe("MEDIUM");
      else expect(alert.riskLevel).toBe("LOW");
    }
  });

  it("metrics counts reconcile with the alert list", () => {
    const summed = fraudMetrics.byLevel.reduce((n, l) => n + l.count, 0);
    expect(summed).toBe(fraudAlerts.length);
    expect(fraudMetrics.blocked).toBe(fraudAlerts.filter((a) => a.action === "BLOCK").length);
  });

  it("is sorted newest-first", () => {
    for (let i = 1; i < fraudAlerts.length; i++) {
      expect(fraudAlerts[i - 1].createdAt >= fraudAlerts[i].createdAt).toBe(true);
    }
  });
});

describe("compliance & audit fixtures", () => {
  it("has stable, non-empty datasets", () => {
    expect(sarReports.length).toBeGreaterThan(50);
    expect(auditEntries.length).toBeGreaterThan(100);
  });
});

describe("analytics builder", () => {
  it("returns one point per day for the requested range", () => {
    expect(buildAnalytics("7d").volumeByDay).toHaveLength(7);
    expect(buildAnalytics("90d").volumeByDay).toHaveLength(90);
  });

  it("keeps total volume equal to the sum of daily volume", () => {
    const a = buildAnalytics("30d");
    const summed = a.volumeByDay.reduce((n, d) => n + d.volumeCents, 0);
    expect(a.totalVolumeCents).toBe(summed);
  });
});
