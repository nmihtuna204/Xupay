import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom";
import { PublicLayout } from "./PublicLayout";
import React from "react";

describe("PublicLayout", () => {
  it("renders layout container", () => {
    const { container } = render(
      <PublicLayout><div>Content</div></PublicLayout>
    );
    expect(container.querySelector("[class*='min-h-screen']")).toBeInTheDocument();
  });

  it("renders header with logo", () => {
    const { container } = render(
      <PublicLayout><div>Content</div></PublicLayout>
    );
    // "XuPay" also appears in the footer brand, so scope to the header
    const header = container.querySelector("header") as HTMLElement;
    expect(within(header).getByText("XuPay")).toBeInTheDocument();
  });

  it("renders login and get started buttons", () => {
    render(
      <PublicLayout><div>Content</div></PublicLayout>
    );
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Get Started")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(
      <PublicLayout><div>Test Content Here</div></PublicLayout>
    );
    expect(screen.getByText("Test Content Here")).toBeInTheDocument();
  });

  it("renders footer", () => {
    render(
      <PublicLayout><div>Content</div></PublicLayout>
    );
    expect(screen.getByText(/© 2025 XuPay/)).toBeInTheDocument();
  });

  it("renders footer links", () => {
    render(
      <PublicLayout><div>Content</div></PublicLayout>
    );
    expect(screen.getByText("Privacy")).toBeInTheDocument();
    expect(screen.getByText("Terms")).toBeInTheDocument();
  });

  it("has fixed header", () => {
    const { container } = render(
      <PublicLayout><div>Content</div></PublicLayout>
    );
    const header = container.querySelector("header");
    expect(header).toHaveClass("fixed", "top-0", "z-50");
  });

  it("supports dark mode", () => {
    const { container } = render(
      <PublicLayout><div>Content</div></PublicLayout>
    );
    const main = container.querySelector("main");
    expect(main?.parentElement).toHaveClass("dark:bg-gray-900");
  });

  it("content area offset by header height", () => {
    const { container } = render(
      <PublicLayout><div>Content</div></PublicLayout>
    );
    const main = container.querySelector("main");
    expect(main).toHaveClass("pt-[3.5rem]");
  });

  it("renders responsive navigation links", () => {
    const { container } = render(
      <PublicLayout><div>Content</div></PublicLayout>
    );
    // Nav links also appear in the footer, so scope to the header nav
    const header = container.querySelector("header") as HTMLElement;
    expect(within(header).getByText("Features")).toBeInTheDocument();
    expect(within(header).getByText("Pricing")).toBeInTheDocument();
    expect(within(header).getByText("Docs")).toBeInTheDocument();
  });
});
