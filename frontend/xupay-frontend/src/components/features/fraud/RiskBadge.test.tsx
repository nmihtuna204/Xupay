import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskBadge } from "./RiskBadge";

describe("RiskBadge", () => {
  it("renders a human-readable label per risk level", () => {
    render(<RiskBadge level="CRITICAL" />);
    expect(screen.getByText("critical")).toBeInTheDocument();
  });

  it("carries the risk level as text, not color alone", () => {
    render(<RiskBadge level="LOW" />);
    // Identity is available to a screen reader via the text node.
    expect(screen.getByText("low")).toBeInTheDocument();
  });
});
