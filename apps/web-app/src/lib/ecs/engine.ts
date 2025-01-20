import { query } from "bitecs";

import type { World } from "./types";
import type { GameStore } from "~/lib/stores/game-state";
import { Camera, CurrentPlayer } from "./components";
import { createGameWorld } from "./world";

export class GameEngine {
  public world: World;
  private animationFrameId: number | null = null;
  private frameInterval = 1 / 60; // Convert to milliseconds
  private store: GameStore;
  private isPaused = false;

  constructor(store: GameStore) {
    this.store = store;
    this.world = createGameWorld();
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
    const deltaTime = deltaTimeMs / 1000;

    if (deltaTimeMs >= this.frameInterval * 1000) {
      this.world.timing.lastFrame =
        timestamp - (deltaTimeMs % (this.frameInterval * 1000));
      this.world.timing.delta = deltaTime;

      // Skip system updates if paused, but still update debug state
      if (!this.isPaused) {
        // Run each system in sequence
        const systemPerformance: Record<string, number> = {};

        for (const { name, system, isPaused } of this.world.systems) {
          // Skip if system doesn't exist or is disabled/paused
          if (isPaused) {
            continue;
          }

          const startTime = performance.now();
          system(this.world);
          const endTime = performance.now();
          systemPerformance[name] = endTime - startTime;
        }

        // Update game state
        this.store.update(this.world);
      }

      // Always update debug state
      // this.debugStore.update(this.world);
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
    }
    this.store.reset();
  }

  public reset() {
    // Stop the current game loop
    this.stop();
    const canvas = this.world.canvas;

    // Reset the world to initial state
    this.world = createGameWorld();
    this.world.canvas = canvas;
    // Reset the stores
    this.store.setWorld(this.world);
    // this.debugStore.setSelectedEntityId(null);

    // Restart the game loop
    this.start();
  }
}
