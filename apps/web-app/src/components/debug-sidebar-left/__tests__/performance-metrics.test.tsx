import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarProvider } from "@acme/ui/sidebar";

import type { GameEngine } from "~/lib/ecs/engine";
import type { World } from "~/lib/ecs/types";
import type { DebugStore } from "~/lib/stores/debug";
import type { GameStore } from "~/lib/stores/game-state";
import { useDebugStore } from "~/providers/debug-provider";
import { useGame } from "~/providers/game-provider";
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
    start: vi.fn(),
    stop: vi.fn(),
    systems: [],
    world: {} as World,
  } as unknown as GameEngine,
  initializeEngine: vi.fn(),
  reset: vi.fn(),
};

// Mock the debug store
const mockDebugStore: DebugStore = {
  getSystems: vi.fn(),
  handleDebugEvent: vi.fn(),
  isDebugging: false,
  isPaused: false,
  metrics: {
    entities: [],
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
  selectedEntityId: null,
  setIsDebugging: vi.fn(),
  setIsPaused: vi.fn(),
  setSelectedEntityId: vi.fn(),
  setSystems: vi.fn(),
  sidebarSections: {
    ecs: true,
    performance: true,
    systems: true,
    visualizations: true,
  },
  systems: {},
  toggleSidebarSection: vi.fn(),
  toggleSystem: vi.fn(),
  toggleSystemPause: vi.fn(),
  toggleVisualization: vi.fn(),
  visualizations: {
    showBoundingBoxes: false,
    showCollisionPoints: false,
    showForceVectors: false,
    showParticleEmitters: false,
    showPolygons: false,
    showTriggerZones: false,
    showVelocityVectors: false,
  },
};

vi.mock("~/providers/game-provider", () => ({
  useGame: vi.fn((selector: (state: GameStore) => unknown) =>
    selector(mockGameStore),
  ),
}));

vi.mock("~/providers/debug-provider", () => ({
  useDebugStore: vi.fn((selector: (state: DebugStore) => unknown) =>
    selector(mockDebugStore),
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
    const updatedStore: DebugStore = {
      ...mockDebugStore,
      metrics: mockDebugStore.metrics
        ? {
            ...mockDebugStore.metrics,
            performance: {
              ...mockDebugStore.metrics.performance,
              fps: 30,
            },
          }
        : null,
    };

    act(() => {
      vi.mocked(useDebugStore).mockImplementation(
        (selector: (state: DebugStore) => unknown) => selector(updatedStore),
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
    const emptyGameStore: GameStore = {
      ...mockGameStore,
      engine: null,
    };

    const emptyDebugStore: DebugStore = {
      ...mockDebugStore,
      metrics: null,
    };

    act(() => {
      vi.mocked(useGame).mockImplementation(
        (selector: (state: GameStore) => unknown) => selector(emptyGameStore),
      );
      vi.mocked(useDebugStore).mockImplementation(
        (selector: (state: DebugStore) => unknown) => selector(emptyDebugStore),
      );
    });

    const { container } = render(<PerformanceMetrics />);

    // The component should not render anything when engine or metrics are missing
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
