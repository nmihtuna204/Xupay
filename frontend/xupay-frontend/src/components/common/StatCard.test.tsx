import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("renders label, value and hint", () => {
    render(<StatCard label="Total volume" value="₫12.5M" hint="last 30 days" />);
    expect(screen.getByText("Total volume")).toBeInTheDocument();
    expect(screen.getByText("₫12.5M")).toBeInTheDocument();
    expect(screen.getByText("last 30 days")).toBeInTheDocument();
  });
});
