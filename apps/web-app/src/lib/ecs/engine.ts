import type { World } from "bitecs";
import { pipe } from "bitecs";

import type { GameStore } from "~/lib/stores/game-state";
import { InputState } from "./input";
import { createBattleSystem } from "./systems/battle";
import { createMovementSystem } from "./systems/movement";
import { createNPCInteractionSystem } from "./systems/npc-interaction";
import { createRenderSystem } from "./systems/render";
import { createGameWorld } from "./world";

export class GameEngine {
  private canvas: HTMLCanvasElement;
  world: World;
  private pipeline: ReturnType<typeof pipe>;
  private animationFrameId: number | null = null;
  private lastTime = performance.now();
  private frameInterval = 1000 / 60;
  private store: GameStore;

  constructor(canvas: HTMLCanvasElement, store: GameStore) {
    this.canvas = canvas;
    this.store = store;
    const { world, playerEid: _playerEid } = createGameWorld(canvas);
    this.world = world;

    const context = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get canvas context");
    }

    // Create pipeline
    this.pipeline = pipe(
      createBattleSystem(),
      createNPCInteractionSystem(),
      createMovementSystem(canvas),
      createRenderSystem(canvas, context),
    );

    // Initialize game state
    // this.store.setEngine(this);
    // this.store.setWorld(this.world);
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
      this.pipeline(this.world);

      // Update game state
      this.store.update(this.world);
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  handleKeyDown(event: KeyboardEvent) {
    InputState.pressedKeys.add(event.key);
  }

  handleKeyUp(event: KeyboardEvent) {
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    InputState.pressedKeys.delete(event.key);
  }

  cleanup() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    InputState.pressedKeys.clear();
    // this.store.reset();
  }
}
