import type { World } from "bitecs";
import { query } from "bitecs";

import type { DebugStore } from "~/lib/stores/debug";
import type { GameStore } from "~/lib/stores/game-state";
import { Camera, CurrentPlayer } from "./components";
import { createAnimationSystem } from "./systems/animation";
import { createCameraSystem } from "./systems/camera";
import { createDebugSystem } from "./systems/debug";
import { createKeyboardSystem } from "./systems/keyboard";
import { createMouseSystem } from "./systems/mouse";
import { createMovementSystem } from "./systems/movement";
import { createParticleSystem } from "./systems/particle";
import { createPhysicsSystem } from "./systems/physics";
import { createRenderSystem } from "./systems/render";
import { createSceneSystem } from "./systems/scene";
import { createScriptSystem } from "./systems/script";
import { createSoundSystem } from "./systems/sound";
import { createSpriteSystem } from "./systems/sprite";
import { createTriggerSystem } from "./systems/trigger";
import { createGameWorld } from "./world";

type GameSystem = (world: World, deltaTime: number) => World;

export class GameEngine {
  private canvas: HTMLCanvasElement;
  world: World;
  private systems: GameSystem[];
  private animationFrameId: number | null = null;
  private lastTime = performance.now();
  private frameInterval = 1 / 60;
  private store: GameStore;
  private debugStore: DebugStore;

  constructor(
    canvas: HTMLCanvasElement,
    store: GameStore,
    debugStore: DebugStore,
  ) {
    this.canvas = canvas;
    this.store = store;
    this.debugStore = debugStore;
    this.world = createGameWorld(canvas);

    const context = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get canvas context");
    }

    // Create systems
    this.systems = [
      createKeyboardSystem(),
      createMouseSystem(),
      createMovementSystem(canvas),
      createPhysicsSystem(),
      createTriggerSystem(),
      createScriptSystem(),
      createSpriteSystem(),
      createAnimationSystem(),
      createSoundSystem(),
      createParticleSystem(),
      createSceneSystem(),
      createCameraSystem(),
      createRenderSystem(canvas, context),
      createDebugSystem(this.debugStore, this.store),
    ];
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
    const deltaTimeMs = timestamp - this.lastTime;
    const deltaTime = deltaTimeMs / 1000;

    if (deltaTimeMs >= this.frameInterval * 1000) {
      this.lastTime = timestamp - (deltaTimeMs % (this.frameInterval * 1000));

      // Run each system in sequence
      let currentWorld = this.world;
      const systemPerformance: Record<string, number> = {};

      for (const system of this.systems) {
        const startTime = performance.now();
        // Only run the system if it's enabled in debug store
        const systemName = system.name || "unknown";
        // if (
        //   this.debugStore.systems[
        //     systemName as keyof typeof this.debugStore.systems
        //   ] !== false
        // ) {
        currentWorld = system(currentWorld, deltaTime);
        // }
        const endTime = performance.now();
        systemPerformance[systemName] = endTime - startTime;
      }

      // Update game state with system performance metrics
      this.store.update(currentWorld, systemPerformance);
      // Update debug state with system performance metrics
      this.debugStore.update(currentWorld);
    }

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

  cleanup() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.store.reset();
  }
}
