import { http, HttpResponse } from "msw";
import { fraudAlerts, fraudMetrics, type RiskLevel } from "../data/fraud";
import { paginate, latency } from "./paginate";

export const fraudHandlers = [
  http.get("/mock-api/fraud/metrics", async () => {
    await latency();
    return HttpResponse.json(fraudMetrics);
  }),

  http.get("/mock-api/fraud/alerts", async ({ request }) => {
    await latency();
    const url = new URL(request.url);
    const level = url.searchParams.get("riskLevel") as RiskLevel | null;
    const filtered = level ? fraudAlerts.filter((a) => a.riskLevel === level) : fraudAlerts;
    return HttpResponse.json(paginate(filtered, url));
  }),
];
