import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Activity } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { SidebarProvider } from "@acme/ui/sidebar";

import { PerformanceMetric } from "../performance-metric";

// Mock the sidebar hooks
vi.mock("@acme/ui/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

describe("PerformanceMetric", () => {
  const mockData = [
    { timestamp: Date.now() - 2000, value: 10 },
    { timestamp: Date.now() - 1000, value: 20 },
    { timestamp: Date.now(), value: 30 },
  ];

  function renderWithSidebar(props: {
    label: string;
    value: number;
    data: typeof mockData;
    icon?: typeof Activity;
    unit: string;
    minDomain?: number;
    maxDomain?: number | "auto";
    formatValue?: (value: number) => string;
  }) {
    return render(
      <SidebarProvider>
        <PerformanceMetric {...props} />
      </SidebarProvider>,
    );
  }

  it("renders with initial data", () => {
    renderWithSidebar({
      data: mockData,
      icon: Activity,
      label: "Frame Time",
      maxDomain: 100,
      minDomain: 0,
      unit: "ms",
      value: 30,
    });

    const metric = screen.getByTestId("performance-metric-Frame Time");
    expect(metric).toBeInTheDocument();

    const button = screen.getByTestId("performance-metric-button-Frame Time");
    expect(button).toBeInTheDocument();

    const value = screen.getByTestId("performance-metric-value-Frame Time");
    expect(value).toHaveTextContent("Frame Time: 30 ms");
  });

  it("expands to show chart when clicked", async () => {
    const user = userEvent.setup();

    renderWithSidebar({
      data: mockData,
      icon: Activity,
      label: "Frame Time",
      maxDomain: 100,
      minDomain: 0,
      unit: "ms",
      value: 30,
    });

    // Chart should not be visible initially
    expect(
      screen.queryByTestId("performance-metric-chart-Frame Time"),
    ).not.toBeInTheDocument();

    // Click to expand
    await user.click(
      screen.getByTestId("performance-metric-button-Frame Time"),
    );

    // Chart should now be visible
    const chart = screen.getByTestId("performance-metric-chart-Frame Time");
    expect(chart).toBeInTheDocument();

    // Check chart percentiles
    expect(screen.getByTestId("metric-chart-p0-ms")).toHaveTextContent(
      "P0: 10.0ms",
    );
    expect(screen.getByTestId("metric-chart-p50-ms")).toHaveTextContent(
      "P50: 20.0ms",
    );
    expect(screen.getByTestId("metric-chart-p95-ms")).toHaveTextContent(
      "P95: 30.0ms",
    );
    expect(screen.getByTestId("metric-chart-p99-ms")).toHaveTextContent(
      "P99: 30.0ms",
    );
    expect(screen.getByTestId("metric-chart-p100-ms")).toHaveTextContent(
      "P100: 30.0ms",
    );
  });

  it("updates value when props change", () => {
    const { rerender } = renderWithSidebar({
      data: mockData,
      icon: Activity,
      label: "Frame Time",
      maxDomain: 100,
      minDomain: 0,
      unit: "ms",
      value: 30,
    });

    expect(
      screen.getByTestId("performance-metric-value-Frame Time"),
    ).toHaveTextContent("Frame Time: 30 ms");

    rerender(
      <SidebarProvider>
        <PerformanceMetric
          label="Frame Time"
          value={40}
          data={[...mockData, { timestamp: Date.now() + 1000, value: 40 }]}
          icon={Activity}
          unit="ms"
          minDomain={0}
          maxDomain={100}
        />
      </SidebarProvider>,
    );

    expect(
      screen.getByTestId("performance-metric-value-Frame Time"),
    ).toHaveTextContent("Frame Time: 40 ms");
  });

  it("formats value according to formatValue prop", () => {
    renderWithSidebar({
      data: mockData,
      formatValue: (v) => v.toFixed(2),
      label: "Memory",
      unit: "MB",
      value: 123.456,
    });

    expect(
      screen.getByTestId("performance-metric-value-Memory"),
    ).toHaveTextContent("Memory: 123.46 MB");
  });
});
