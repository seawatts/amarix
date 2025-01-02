import type { World } from "bitecs";
import { query } from "bitecs";

import type { GameStore } from "~/lib/stores/game-state";
import { CurrentPlayer } from "./components";
import { createKeyboardSystem } from "./systems/keyboard";
import { createMouseSystem } from "./systems/mouse";
import { createMovementSystem } from "./systems/movement";
import { createRenderSystem } from "./systems/render";
import { createGameWorld } from "./world";

export class GameEngine {
  private canvas: HTMLCanvasElement;
  world: World;
  private systems: ((world: World) => World)[];
  private animationFrameId: number | null = null;
  private lastTime = performance.now();
  private frameInterval = 1000 / 60;
  private store: GameStore;

  constructor(canvas: HTMLCanvasElement, store: GameStore) {
    this.canvas = canvas;
    this.store = store;
    this.world = createGameWorld(canvas);

    const context = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get canvas context");
    }

    // Create systems
    this.systems = [
      createKeyboardSystem(),
      createMouseSystem(),
      // createBattleSystem(),
      // createNPCInteractionSystem(),
      createMovementSystem(canvas),
      createRenderSystem(canvas, context),
    ] as ((world: World) => World)[];
  }

  public start() {
    if (this.animationFrameId !== null) return;
    this.lastTime = performance.now();
    this.gameLoop(performance.now());
  }

  public stop() {
    if (this.animationFrameId === null) return;
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  private gameLoop = (timestamp: number) => {
    const deltaTime = timestamp - this.lastTime;

    if (deltaTime >= this.frameInterval) {
      this.lastTime = timestamp - (deltaTime % this.frameInterval);

      // Run each system in sequence
      let currentWorld = this.world;
      for (const system of this.systems) {
        currentWorld = system(currentWorld);
      }

      // Update game state
      this.store.update(currentWorld);
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  public getPlayerEid() {
    const players = query(this.world, [CurrentPlayer]);
    return players[0] ?? 0;
  }

  cleanup() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.store.reset();
  }
}
