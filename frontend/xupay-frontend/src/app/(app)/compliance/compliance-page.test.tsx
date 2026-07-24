import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import CompliancePage from "./page";
import { renderWithProviders } from "@/test/test-utils";

describe("Compliance / SAR page (MSW-backed)", () => {
  it("renders SAR reports from the mock API", async () => {
    renderWithProviders(<CompliancePage />);

    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);

    // SAR references follow the SAR-2026-#### convention.
    expect(within(table).getAllByText(/SAR-2026-\d+/).length).toBeGreaterThan(0);
  });
});
