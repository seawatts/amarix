import { query } from "bitecs";

import type { World } from "./types";
import type { GameStore } from "~/lib/stores/game-state";
import { Camera, CurrentPlayer } from "./components";
import { createAnimationSystem } from "./systems/animation";
import { createCameraSystem } from "./systems/camera";
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

type GameSystem = (world: World) => World;

export class GameEngine {
  private canvas: HTMLCanvasElement;
  public world: World;
  private _systems: { name: string; system: GameSystem }[];
  private animationFrameId: number | null = null;
  private frameInterval = 1 / 60; // Convert to milliseconds
  private store: GameStore;
  private isPaused = false;

  constructor(canvas: HTMLCanvasElement, store: GameStore) {
    this.canvas = canvas;
    this.store = store;
    this.world = createGameWorld(canvas);
    this.world.timing = {
      delta: 0,
      lastFrame: performance.now(),
    };

    const context = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get canvas context");
    }

    // Create systems
    this._systems = [
      { name: "keyboard", system: createKeyboardSystem() },
      { name: "mouse", system: createMouseSystem(canvas) },
      { name: "movement", system: createMovementSystem(canvas) },
      { name: "physics", system: createPhysicsSystem() },
      { name: "trigger", system: createTriggerSystem() },
      { name: "script", system: createScriptSystem() },
      { name: "sprite", system: createSpriteSystem() },
      { name: "animation", system: createAnimationSystem() },
      { name: "sound", system: createSoundSystem() },
      { name: "particle", system: createParticleSystem() },
      { name: "scene", system: createSceneSystem() },
      { name: "camera", system: createCameraSystem() },
      { name: "render", system: createRenderSystem(canvas, context) },
    ];

    const initialSystems: Record<
      string,
      { isEnabled: boolean; isPaused: boolean }
    > = {};
    for (const { name } of this._systems) {
      initialSystems[name] = { isEnabled: true, isPaused: false };
    }
    // this.debugStore.setSystems(initialSystems);
  }

  public addSystem(system: GameSystem) {
    this._systems.push({ name: system.name, system });
  }

  public get systems() {
    return [...this._systems];
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
        let currentWorld = this.world;
        const systemPerformance: Record<string, number> = {};

        for (const { name, system } of this._systems) {
          const startTime = performance.now();
          currentWorld = system(currentWorld);
          const endTime = performance.now();
          systemPerformance[name] = endTime - startTime;
        }

        // Update game state
        this.store.update(currentWorld);
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

    // Reset the world to initial state
    this.world = createGameWorld(this.canvas);
    // Reset the stores
    this.store.setWorld(this.world);
    // this.debugStore.setSelectedEntityId(null);

    // Restart the game loop
    this.start();
  }
}
