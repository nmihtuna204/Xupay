import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Sidebar } from "./Sidebar";
import React from "react";

describe("Sidebar", () => {
  it("renders the XuPay logo", () => {
    render(<Sidebar />);
    expect(screen.getByText("XuPay")).toBeInTheDocument();
  });

  it("renders navigation groups from config", () => {
    render(<Sidebar />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Management")).toBeInTheDocument();
    expect(screen.getByText("Compliance")).toBeInTheDocument();
  });

  it("renders navigation items from config", () => {
    render(<Sidebar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Wallets")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
  });

  it("starts expanded (w-64) with a visible Collapse label", () => {
    const { container } = render(<Sidebar />);
    const aside = container.querySelector("aside") as HTMLElement;
    expect(aside.className).toContain("w-64");
    expect(screen.getByText("Collapse")).toBeInTheDocument();
  });

  it("collapses to w-16 and hides logo text when toggle is clicked", async () => {
    const { container } = render(<Sidebar />);

    await userEvent.click(screen.getByTitle("Collapse sidebar"));

    const aside = container.querySelector("aside") as HTMLElement;
    expect(aside.className).toContain("w-16");
    expect(screen.queryByText("XuPay")).not.toBeInTheDocument();
    expect(screen.queryByText("Collapse")).not.toBeInTheDocument();
    // Toggle now offers to expand
    expect(screen.getByTitle("Expand sidebar")).toBeInTheDocument();
  });

  it("expands again when toggle is clicked twice", async () => {
    const { container } = render(<Sidebar />);

    await userEvent.click(screen.getByTitle("Collapse sidebar"));
    await userEvent.click(screen.getByTitle("Expand sidebar"));

    const aside = container.querySelector("aside") as HTMLElement;
    expect(aside.className).toContain("w-64");
    expect(screen.getByText("XuPay")).toBeInTheDocument();
  });

  it("merges a custom className", () => {
    const { container } = render(<Sidebar className="custom-sidebar" />);
    const aside = container.querySelector("aside") as HTMLElement;
    expect(aside).toHaveClass("custom-sidebar");
  });

  it("logo links to the dashboard", () => {
    render(<Sidebar />);
    const logoLink = screen.getByText("XuPay").closest("a");
    expect(logoLink).toHaveAttribute("href", "/dashboard");
  });
});
