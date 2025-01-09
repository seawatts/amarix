import { addEntity, createWorld } from "bitecs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GameEngine } from "../../ecs/engine";
import { Debug, Named } from "../../ecs/components";
import { createGameStore, defaultInitState } from "../game-state";

describe("Game State Store", () => {
  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const store = createGameStore();
      const state = store.getState();

      expect(state.engine).toBeNull();
      expect(state.world).toBeNull();
      expect(state.metrics).toBeNull();
      expect(state.lastFrameTime).toBe(0);
    });

    it("should initialize with custom state", () => {
      const world = createWorld();
      const customState = {
        ...defaultInitState,
        lastFrameTime: 1000,
        world,
      };

      const store = createGameStore(customState);
      const state = store.getState();

      expect(state.world).toBe(world);
      expect(state.lastFrameTime).toBe(1000);
    });
  });

  describe("State Updates", () => {
    it("should set engine", () => {
      const store = createGameStore();
      const mockEngine = {
        animationFrameId: 0,
        canvas: document.createElement("canvas"),
        isRunning: false,
        lastFrameTime: 0,
        start: vi.fn(),
        stop: vi.fn(),
        systems: [],
        world: createWorld(),
      } as unknown as GameEngine;
      store.getState().setEngine(mockEngine);

      expect(store.getState().engine).toBe(mockEngine);
    });

    it("should set world", () => {
      const store = createGameStore();
      const world = createWorld();
      store.getState().setWorld(world);

      expect(store.getState().world).toBe(world);
    });

    it("should reset state", () => {
      const store = createGameStore();
      const world = createWorld();
      store.getState().setWorld(world);
      store.getState().reset();

      const state = store.getState();
      expect({
        engine: state.engine,
        lastFrameTime: state.lastFrameTime,
        metrics: state.metrics,
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

    it("should collect entity metrics", () => {
      const world = createWorld();
      const store = createGameStore();
      const eid = addEntity(world);

      // Add some component data
      Named.name[eid] = "Test Entity";
      Debug.logLevel[eid] = 3;

      store.getState().update(world);
      const metrics = store.getState().metrics;

      expect(metrics).toBeDefined();
      if (!metrics) return;

      expect(metrics.entities).toHaveLength(1);
      const entity = metrics.entities[0];
      expect(entity).toBeDefined();
      if (!entity) return;

      interface EntityComponent {
        data: Record<string, unknown>;
        component: Record<string, unknown>;
      }

      interface Entity {
        id: number;
        name?: string;
        components: Record<string, EntityComponent>;
      }

      const typedEntity = entity as Entity;

      expect(typedEntity.id).toBe(eid);
      expect(typedEntity.name).toBe("Test Entity");
      expect(typedEntity.components.Named).toBeDefined();
      expect(typedEntity.components.Named?.data.name).toBe("Test Entity");
      expect(typedEntity.components.Debug).toBeDefined();
      expect(typedEntity.components.Debug?.data.logLevel).toBe(3);
    });

    it("should collect performance metrics", () => {
      const world = createWorld();
      const store = createGameStore();
      store.getState().update(world, { TestSystem: 16 });

      const metrics = store.getState().metrics;
      expect(metrics?.performance).toMatchObject({
        fps: expect.any(Number),
        frameTime: expect.any(Number),
        memoryUsage: 1_000_000,
        systems: {
          GameState: expect.any(Number),
          TestSystem: 16,
        },
      });
    });

    it("should handle undefined memory metrics", () => {
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
        memory: undefined,
        navigation: {} as PerformanceNavigation,
        now: () => 1000,
        onresourcetimingbufferfull: null,
        setResourceTimingBufferSize: vi.fn(),
        timeOrigin: 0,
        timing: {} as PerformanceTiming,
        toJSON: vi.fn(),
      };
      globalThis.performance = mockPerformance as unknown as Performance;

      const world = createWorld();
      const store = createGameStore();
      store.getState().update(world);

      const metrics = store.getState().metrics;
      expect(metrics?.performance.memoryUsage).toBe(0);
    });
  });
});
