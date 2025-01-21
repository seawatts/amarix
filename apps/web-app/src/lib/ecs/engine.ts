import { query } from "bitecs";

import type { GameSystem, World } from "./types";
import type { GameStore } from "~/lib/stores/game-state";
import { Camera, CurrentPlayer } from "./components";

export class GameEngine {
  public world: World;
  private animationFrameId: number | null = null;
  private frameInterval = 1 / 60; // Target 60 FPS
  private store: GameStore;
  private isPaused = false;
  private lastFrameTime = 0;
  public systems: {
    name: string;
    system: GameSystem;
    isPaused?: boolean;
  }[] = [];

  constructor({
    store,
    world,
    systems,
  }: {
    store: GameStore;
    canvas: HTMLCanvasElement;
    world: World;
    systems: {
      name: string;
      system: GameSystem;
      isPaused?: boolean;
    }[];
  }) {
    this.store = store;
    this.world = world;
    this.systems = systems;
    this.world.timing = {
      delta: 0,
      lastFrame: performance.now(),
    };
  }

  public start() {
    if (this.animationFrameId !== null) return;
    this.world.timing.lastFrame = performance.now();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  public stop() {
    if (this.animationFrameId === null) return;
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  public togglePause() {
    this.isPaused = !this.isPaused;
    this.world.isPaused = this.isPaused;
    // this.debugStore.setIsPaused(this.isPaused);
  }

  private gameLoop = (timestamp: number) => {
    // Don't continue if engine has been stopped
    if (this.animationFrameId === null) return;

    const deltaTimeMs = timestamp - this.world.timing.lastFrame;
    const deltaTime = deltaTimeMs / 1000; // Convert to seconds

    // Update timing immediately
    this.world.timing.lastFrame = timestamp;
    this.world.timing.delta = deltaTime;

    // Skip system updates if paused, but still update debug state
    if (!this.isPaused) {
      // Run each system in sequence
      const systemPerformance: Record<string, number> = {};

      for (const { name, system, isPaused } of this.systems) {
        // Skip if system doesn't exist or is disabled/paused
        if (isPaused) {
          continue;
        }

        const startTime = performance.now();
        system(this.world);
        const endTime = performance.now();
        systemPerformance[name] = endTime - startTime;
      }
    }

    // Request next frame
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  public getPlayerEid() {
    const players = query(this.world, [CurrentPlayer]);
    return players[0] ?? 0;
  }

  public getCameraEid() {
    const cameras = query(this.world, [Camera]);
    return cameras[0] ?? 0;
  }

  public cleanup() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Reset performance metrics
    this.world.timing = {
      delta: 0,
      lastFrame: performance.now(),
    };

    this.store.reset();
  }

  public reset(world: World) {
    // Stop the current game loop and clean up
    this.stop();
    this.cleanup();

    // Reset the world to initial state
    this.world = world;

    // Restart the game loop
    this.start();
  }
}
