import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Topbar } from "./Topbar";
import { renderWithProviders } from "@/test/test-utils";
import React from "react";

// Topbar renders UserMenu (useAuth) and ThemeToggle, so it needs providers.

describe("Topbar", () => {
  it("renders a header element", () => {
    const { container } = renderWithProviders(<Topbar />);
    expect(container.querySelector("header")).toBeInTheDocument();
  });

  it("shows the page title for the active route (Dashboard fallback)", () => {
    renderWithProviders(<Topbar />);
    // usePathname is mocked to '/' so the fallback title renders
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("renders the mobile menu button", () => {
    renderWithProviders(<Topbar />);
    expect(screen.getByLabelText("Toggle menu")).toBeInTheDocument();
  });

  it("calls onMenuClick when menu button is clicked", async () => {
    const handleClick = vi.fn();
    renderWithProviders(<Topbar onMenuClick={handleClick} />);
    await userEvent.click(screen.getByLabelText("Toggle menu"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders the global search input", () => {
    renderWithProviders(<Topbar />);
    expect(
      screen.getByPlaceholderText("Search transactions, wallets...")
    ).toBeInTheDocument();
  });

  it("renders notification, new and command palette actions", () => {
    renderWithProviders(<Topbar />);
    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
    expect(screen.getByLabelText("New")).toBeInTheDocument();
    expect(screen.getByLabelText("Command Palette")).toBeInTheDocument();
  });

  it("merges a custom className on the header", () => {
    const { container } = renderWithProviders(<Topbar className="custom-topbar" />);
    expect(container.querySelector("header")).toHaveClass("custom-topbar");
  });
});
