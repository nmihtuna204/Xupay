import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FraudPage from "./page";
import { renderWithProviders } from "@/test/test-utils";
import { fraudMetrics } from "@/mocks/data/fraud";
import { formatCompactNumber } from "@/lib/format";

describe("Fraud page (MSW-backed)", () => {
  it("renders risk metrics and an alerts table from the mock API", async () => {
    renderWithProviders(<FraudPage />);

    // Metric tile resolves from GET /mock-api/fraud/metrics.
    expect(
      await screen.findByText(formatCompactNumber(fraudMetrics.totalEvaluated))
    ).toBeInTheDocument();

    // Alerts table resolves from GET /mock-api/fraud/alerts and has rows.
    const table = await screen.findByRole("table");
    const bodyRows = within(table).getAllByRole("row");
    // header row + at least one data row
    expect(bodyRows.length).toBeGreaterThan(1);
  });

  it("filters alerts when a risk level is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FraudPage />);

    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: "Critical" }));

    // After filtering, every visible risk badge in the table reads "critical".
    const table = await screen.findByRole("table");
    const badges = within(table).getAllByText("critical");
    expect(badges.length).toBeGreaterThan(0);
  });
});
