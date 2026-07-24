import { describe, expect, it } from "vitest";
import { screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuditLogPage from "./page";
import { renderWithProviders } from "@/test/test-utils";

describe("Audit Log page (MSW-backed)", () => {
  it("renders a page of audit entries from the mock API", async () => {
    renderWithProviders(<AuditLogPage />);
    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);
  });

  it("narrows results by category filter", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuditLogPage />);
    await screen.findByRole("table");

    await user.click(screen.getByRole("button", { name: "Payment" }));

    // Every category badge in the filtered table should read "payment".
    await waitFor(() => {
      const table = screen.getByRole("table");
      const badges = within(table).getAllByText("payment");
      expect(badges.length).toBeGreaterThan(0);
    });
  });
});
