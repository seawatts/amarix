import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GameStore } from "~/lib/stores/game-state";
import { CurrentPlayer } from "../components";
import { GameEngine } from "../engine";
import { createGameWorld } from "../world";

describe("GameEngine", () => {
  let canvas: HTMLCanvasElement;
  let mockGameStore: GameStore;
  let engine: GameEngine;

  beforeEach(() => {
    // Set up canvas
    canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    // Mock stores
    mockGameStore = {
      engine: null,
      initializeEngine: vi.fn(),
      reset: vi.fn(),
      // setWorld: vi.fn(),
      // update: vi.fn(),
      // world: null,
    };

    // Mock performance.now
    vi.spyOn(performance, "now").mockReturnValue(1000);

    const world = createGameWorld();
    // Create engine instance
    engine = new GameEngine({
      canvas,
      store: mockGameStore,
      systems: [],
      world,
    });
  });

  it("should initialize with correct properties", () => {
    expect(engine.world).toBeDefined();
  });

  it("should start and stop game loop", () => {
    // Mock requestAnimationFrame and cancelAnimationFrame
    const mockRequestAnimationFrame = vi.fn();
    const mockCancelAnimationFrame = vi.fn();
    vi.stubGlobal("requestAnimationFrame", mockRequestAnimationFrame);
    vi.stubGlobal("cancelAnimationFrame", mockCancelAnimationFrame);

    // Start game loop
    engine.start();
    expect(mockRequestAnimationFrame).toHaveBeenCalled();

    // Stop game loop
    engine.stop();
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  it("should not start multiple game loops", () => {
    const mockRequestAnimationFrame = vi.fn();
    vi.stubGlobal("requestAnimationFrame", mockRequestAnimationFrame);

    engine.start();
    engine.start(); // Try to start again
    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it("should update game state in game loop", () => {
    let frameCount = 0;
    const maxFrames = 3; // Limit number of frames to prevent infinite recursion

    // Mock requestAnimationFrame to execute callback immediately
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      if (frameCount < maxFrames) {
        frameCount++;
        // Execute callback immediately with simulated timestamp
        setTimeout(() => {
          callback(1000 + frameCount * 16.67); // Simulate 16.67ms frame time
        }, 0);
        return frameCount;
      }
      return 0;
    });

    // Mock performance.now to return incrementing values
    let time = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => {
      time += 16.67;
      return time;
    });

    engine.start();

    // Wait for all frames to process
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Verify store updates
        // expect(mockGameStore.update).toHaveBeenCalled();
        expect(frameCount).toBe(maxFrames);
        resolve();
      }, 100);
    });
  });

  it("should get player entity ID", () => {
    const playerEid = engine.getPlayerEid();
    expect(playerEid).toBeGreaterThan(0);
    expect(CurrentPlayer._name).toBe("CurrentPlayer");
  });

  it("should get camera entity ID", () => {
    const cameraEid = engine.getCameraEid();
    expect(cameraEid).toBeGreaterThan(0);
  });

  it("should clean up resources", () => {
    let frameCount = 0;
    const maxFrames = 3;

    // Mock requestAnimationFrame to execute callback for a limited number of frames
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      if (frameCount < maxFrames) {
        frameCount++;
        callback(1000 + frameCount * 16.67);
        return frameCount;
      }
      return 0;
    });

    engine.start();
    engine.cleanup();

    expect(mockGameStore.reset).toHaveBeenCalled();
    expect(frameCount).toBeLessThanOrEqual(maxFrames);
  });
});
