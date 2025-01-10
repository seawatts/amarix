import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarProvider } from "@acme/ui/sidebar";

import type { GameStore } from "~/lib/stores/game-state";
import { useGameStore } from "~/providers/game-store-provider";
import { PerformanceMetrics } from "../performance-metrics";

// Mock the sidebar hooks
vi.mock("@acme/ui/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

// Mock the chart component
vi.mock("../metric-chart", () => ({
  MetricChart: () => <div data-testid="mock-chart" />,
}));

// Create a mock canvas element
const mockCanvas = document.createElement("canvas");

// Mock the game store
const mockGameStore: GameStore = {
  engine: {
    animationFrameId: 0,
    canvas: mockCanvas,
    isRunning: false,
    pause: vi.fn(),
    resume: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    systems: [],
    update: vi.fn(),
    world: {} as any,
  },
  lastFrameTime: 0,
  metrics: {
    entities: [
      {
        components: {},
        id: 1,
      },
    ],
    performance: {
      fps: 60,
      frameTime: 17,
      memoryUsage: 1024 * 1024 * 100, // 100MB
      systems: {
        physicsSystem: 5,
        renderSystem: 8,
      },
    },
  },
  reset: vi.fn(),
  setEngine: vi.fn(),
  setWorld: vi.fn(),
  update: vi.fn(),
  world: {} as any,
};

vi.mock("~/providers/game-store-provider", () => ({
  useGameStore: vi.fn((selector: (state: GameStore) => unknown) =>
    selector(mockGameStore),
  ),
}));

describe("PerformanceMetrics", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  async function renderWithSidebar() {
    const user = userEvent.setup();
    const result = render(
      <SidebarProvider>
        <PerformanceMetrics />
      </SidebarProvider>,
    );

    // Wait for the component to be rendered and click the trigger
    const trigger = await screen.findByTestId("performance-metrics-trigger");
    await user.click(trigger);

    return { ...result, user };
  }

  it("renders performance metrics", async () => {
    const { user } = await renderWithSidebar();

    // Find and click all metric buttons
    const metricButtons = await screen.findAllByTestId(
      /performance-metric-button-/,
    );
    for (const button of metricButtons) {
      await user.click(button);
    }

    // Wait for metrics to be visible
    await waitFor(() => {
      const fps = screen.getByTestId("performance-metric-value-FPS");
      const frameTime = screen.getByTestId(
        "performance-metric-value-Frame Time",
      );
      const memory = screen.getByTestId("performance-metric-value-Memory");

      expect(fps).toHaveTextContent(/FPS:\s*60/);
      expect(frameTime).toHaveTextContent(/Frame Time:\s*17 ms/);
      expect(memory).toHaveTextContent(/Memory:\s*100 MB/);
    });
  });

  it("updates metrics over time", async () => {
    const { user } = await renderWithSidebar();

    // Find and click the FPS button
    const fpsButton = await screen.findByTestId(
      "performance-metric-button-FPS",
    );
    await user.click(fpsButton);

    // Wait for initial metrics
    await waitFor(() => {
      const fps = screen.getByTestId("performance-metric-value-FPS");
      expect(fps).toHaveTextContent(/FPS:\s*60/);
    });

    // Update mock metrics
    const updatedStore: GameStore = {
      ...mockGameStore,
      metrics: mockGameStore.metrics && {
        entities: mockGameStore.metrics.entities,
        performance: {
          ...mockGameStore.metrics.performance,
          fps: 30,
        },
      },
    };

    await act(async () => {
      vi.mocked(useGameStore).mockImplementation(
        (selector: (state: GameStore) => unknown) => selector(updatedStore),
      );

      vi.advanceTimersByTime(100);
    });

    // Wait for updated metrics
    await waitFor(() => {
      const fps = screen.getByTestId("performance-metric-value-FPS");
      expect(fps).toHaveTextContent(/FPS:\s*30/);
    });
  });

  it("expands system metrics when clicked", async () => {
    const { user } = await renderWithSidebar();

    // Wait for systems button to be visible and click it
    const systemsButton = await screen.findByTestId(
      "performance-metrics-systems-button",
    );
    await user.click(systemsButton);

    // Wait for system metrics to be visible
    await waitFor(() => {
      const physicsSystem = screen.getByText(/Physics:\s*5.00 ms/);
      const renderSystem = screen.getByText(/Render:\s*8.00 ms/);

      expect(physicsSystem).toBeInTheDocument();
      expect(renderSystem).toBeInTheDocument();
    });
  });

  it("handles missing engine or metrics", async () => {
    const emptyStore: GameStore = {
      engine: null,
      lastFrameTime: 0,
      metrics: null,
      reset: vi.fn(),
      setEngine: vi.fn(),
      setWorld: vi.fn(),
      update: vi.fn(),
      world: {} as any,
    };

    await act(async () => {
      vi.mocked(useGameStore).mockImplementation(
        (selector: (state: GameStore) => unknown) => selector(emptyStore),
      );
    });

    const { container } = render(<PerformanceMetrics />);

    // The component should not render anything when engine or metrics are missing
    expect(container.firstChild).toBeNull();
  });
});
