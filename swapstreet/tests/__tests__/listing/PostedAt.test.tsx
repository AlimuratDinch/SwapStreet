import React from "react";
import { render, screen } from "@testing-library/react";
import PostedAt from "@/app/listing/[id]/PostedAt";

describe("PostedAt", () => {
  const RealDateNow = Date.now;

  afterEach(() => {
    (Date as any).now = RealDateNow;
    jest.useRealTimers();
  });

  it("shows relative label and local time for a recent date", () => {
    const now = new Date("2025-01-01T12:00:00Z");
    (Date as any).now = () => now.getTime();

    const fiveSecondsAgo = new Date(now.getTime() - 5000).toISOString();

    render(<PostedAt iso={fiveSecondsAgo} />);

    expect(screen.getByText(/just now|seconds ago/)).toBeInTheDocument();
    expect(screen.getByText(/\(/)).toBeInTheDocument(); // contains local time
  });

  it("renders raw iso if invalid date", () => {
    render(<PostedAt iso={"not-a-date"} />);
    expect(screen.getByText("not-a-date")).toBeInTheDocument();
  });

  it("renders minute/hour/day labels for appropriate iso offsets", () => {
    // 90 seconds ago -> minutes
    const now = Date.now();
    const oneMinAgo = new Date(now - 90 * 1000).toISOString();
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();

    const { rerender } = render(<PostedAt iso={oneMinAgo} />);
    expect(screen.getByText(/minute/)).toBeInTheDocument();

    rerender(<PostedAt iso={twoHoursAgo} />);
    expect(screen.getByText(/hour/)).toBeInTheDocument();

    rerender(<PostedAt iso={threeDaysAgo} />);
    expect(screen.getByText(/day/)).toBeInTheDocument();
  });

  it("renders 'just now' for very recent timestamps", () => {
    const now = Date.now();
    const fiveSecAgo = new Date(now - 5 * 1000).toISOString();
    render(<PostedAt iso={fiveSecAgo} />);
    expect(screen.getByText(/just now/)).toBeInTheDocument();
  });

  it("renders singular vs plural minute/hour/day correctly", () => {
    const now = Date.now();
    const oneMinAgo = new Date(now - 61 * 1000).toISOString();
    const twoMinAgo = new Date(now - 2 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(now - 61 * 60 * 1000).toISOString();
    const twoHourAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now - 25 * 60 * 60 * 1000).toISOString();
    const twoDayAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();

    const { rerender } = render(<PostedAt iso={oneMinAgo} />);
    expect(screen.getByText(/1 minute ago/)).toBeInTheDocument();

    rerender(<PostedAt iso={twoMinAgo} />);
    expect(screen.getByText(/2 minutes ago/)).toBeInTheDocument();

    rerender(<PostedAt iso={oneHourAgo} />);
    expect(screen.getByText(/1 hour ago/)).toBeInTheDocument();

    rerender(<PostedAt iso={twoHourAgo} />);
    expect(screen.getByText(/2 hours ago/)).toBeInTheDocument();

    rerender(<PostedAt iso={oneDayAgo} />);
    expect(screen.getByText(/1 day ago/)).toBeInTheDocument();

    rerender(<PostedAt iso={twoDayAgo} />);
    expect(screen.getByText(/2 days ago/)).toBeInTheDocument();
  });

  it("handles Date.now returning NaN and triggers isNaN(seconds) branch", () => {
    const realNow = Date.now;
    (Date as any).now = () => NaN;
    const iso = new Date().toISOString();
    const { container } = render(<PostedAt iso={iso} />);
    const el = container.querySelector(".text-gray-200");
    expect(el).toBeTruthy();
    const text = el?.textContent ?? "";
    expect(text.includes("(")).toBe(true);
    expect(/minute|hour|day|just now/.test(text)).toBe(false);
    (Date as any).now = realNow;
  });

  it("renders empty when iso is undefined", () => {
    const { container } = render(<PostedAt iso={undefined} />);
    const el = container.querySelector(".text-gray-200");
    expect(el).toBeTruthy();
    expect(el?.textContent).toBe("");
  });
});
