import { http, HttpResponse } from "msw";
import { auditEntries, type AuditCategory } from "../data/audit-log";
import { paginate, latency } from "./paginate";

export const auditHandlers = [
  http.get("/mock-api/audit-log", async ({ request }) => {
    await latency();
    const url = new URL(request.url);
    const category = url.searchParams.get("category") as AuditCategory | null;
    const search = url.searchParams.get("q")?.toLowerCase();

    let filtered = category ? auditEntries.filter((e) => e.category === category) : auditEntries;
    if (search) {
      filtered = filtered.filter(
        (e) =>
          e.actor.toLowerCase().includes(search) ||
          e.action.toLowerCase().includes(search) ||
          e.target.includes(search)
      );
    }
    return HttpResponse.json(paginate(filtered, url));
  }),
];
