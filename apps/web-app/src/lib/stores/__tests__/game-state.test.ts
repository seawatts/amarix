import { addEntity, createWorld } from "bitecs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WorldProps } from "~/lib/ecs/types";
import { Debug, Named } from "../../ecs/components";
import { createGameStore, defaultInitState } from "../game-state";

describe("Game State Store", () => {
  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const store = createGameStore();
      const state = store.getState();

      expect(state.engine).toBeNull();
      expect(state.world).toBeNull();
      expect(state.world?.timing.lastFrame).toBe(0);
    });

    it("should initialize with custom state", () => {
      const world = createWorld<WorldProps>();
      const customState = {
        ...defaultInitState,
        lastFrameTime: 1000,
        world,
      };

      const store = createGameStore(customState);
      const state = store.getState();

      expect(state.world).toBe(world);
      expect(state.world?.timing.lastFrame).toBe(1000);
    });
  });

  describe("State Updates", () => {
    it("should set world", () => {
      const store = createGameStore();
      const world = createWorld<WorldProps>();
      store.getState().setWorld(world);

      expect(store.getState().world).toBe(world);
    });

    it("should reset state", () => {
      const store = createGameStore();
      const world = createWorld<WorldProps>();
      store.getState().setWorld(world);
      store.getState().reset();

      const state = store.getState();
      expect({
        engine: state.engine,
        world: state.world,
      }).toEqual(defaultInitState);
    });
  });

  describe("Metrics Collection", () => {
    let originalPerformance: typeof performance;

    beforeEach(() => {
      vi.useFakeTimers();
      originalPerformance = globalThis.performance;
      const mockPerformance = {
        clearMarks: vi.fn(),
        clearMeasures: vi.fn(),
        clearResourceTimings: vi.fn(),
        eventCounts: {} as PerformanceEventMap,
        getEntries: vi.fn(),
        getEntriesByName: vi.fn(),
        getEntriesByType: vi.fn(),
        mark: vi.fn(),
        measure: vi.fn(),
        memory: { usedJSHeapSize: 1_000_000 },
        navigation: {} as PerformanceNavigation,
        now: () => 1000,
        onresourcetimingbufferfull: null,
        setResourceTimingBufferSize: vi.fn(),
        timeOrigin: 0,
        timing: {} as PerformanceTiming,
        toJSON: vi.fn(),
      };
      globalThis.performance = mockPerformance as unknown as Performance;
    });

    afterEach(() => {
      vi.useRealTimers();
      globalThis.performance = originalPerformance;
    });
  });
});
