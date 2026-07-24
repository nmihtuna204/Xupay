import { http, HttpResponse } from "msw";
import { sarReports, getSarReport, type SarStatus } from "../data/compliance";
import { paginate, latency } from "./paginate";

export const complianceHandlers = [
  http.get("/mock-api/compliance/reports", async ({ request }) => {
    await latency();
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as SarStatus | null;
    const filtered = status ? sarReports.filter((r) => r.status === status) : sarReports;
    return HttpResponse.json(paginate(filtered, url));
  }),

  http.get("/mock-api/compliance/reports/:id", async ({ params }) => {
    await latency();
    const report = getSarReport(params.id as string);
    if (!report) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(report);
  }),
];
