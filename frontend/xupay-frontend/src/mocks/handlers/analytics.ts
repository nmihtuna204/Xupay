import { http, HttpResponse } from "msw";
import { buildAnalytics } from "../data/analytics";
import { latency } from "./paginate";

export const analyticsHandlers = [
  http.get("/mock-api/analytics/overview", async ({ request }) => {
    await latency();
    const url = new URL(request.url);
    const range = url.searchParams.get("range") ?? "30d";
    return HttpResponse.json(buildAnalytics(range));
  }),
];
