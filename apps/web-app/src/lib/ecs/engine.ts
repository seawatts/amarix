import type { World } from "bitecs";
import { pipe } from "bitecs";

import { Movement, Player, Position } from "./components";
import { createMovementSystem } from "./systems/movement";
import { createRenderSystem } from "./systems/render";
import { createGameWorld, createPlayer } from "./world";

export interface DebugMetrics {
  fps: number;
  entityCount: number;
  componentCounts: {
    position: number;
    movement: number;
    player: number;
  };
  memoryUsage: number;
  lastFrameTime: number;
}

export class GameEngine {
  private world: World;
  private pipeline: (world: World) => void;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = performance.now();
  private frameCount = 0;
  private lastFpsUpdateTime: number = performance.now();
  private currentFps = 0;
  private player: number | null = null;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.world = createGameWorld();
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not get canvas context");
    }

    // Create pipeline of systems
    this.pipeline = pipe(
      createMovementSystem(canvas),
      createRenderSystem(canvas, context),
    );

    // Create initial player
    this.player = createPlayer(this.world);

    // Set up canvas size
    this.updateCanvasSize();
    globalThis.addEventListener("resize", this.handleResize);
  }

  private handleResize = () => {
    this.updateCanvasSize();
  };

  private updateCanvasSize() {
    this.canvas.width = globalThis.innerWidth;
    this.canvas.height = globalThis.innerHeight;
  }

  public start() {
    if (this.animationFrameId !== null) return;
    this.gameLoop();
  }

  public stop() {
    if (this.animationFrameId === null) return;
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  private gameLoop = () => {
    const currentTime = performance.now();
    this.lastFrameTime = currentTime;

    // Update FPS counter
    this.frameCount++;
    if (currentTime - this.lastFpsUpdateTime >= 1000) {
      this.currentFps = Math.round(
        (this.frameCount * 1000) / (currentTime - this.lastFpsUpdateTime),
      );
      this.frameCount = 0;
      this.lastFpsUpdateTime = currentTime;
    }

    // Run all systems
    this.pipeline(this.world);

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  public handleKeyDown = (event: KeyboardEvent) => {
    if (!this.player) return;

    const eid = this.player;
    switch (event.key) {
      case "ArrowUp": {
        Movement.dy[eid] = -1;
        break;
      }
      case "ArrowDown": {
        Movement.dy[eid] = 1;
        break;
      }
      case "ArrowLeft": {
        Movement.dx[eid] = -1;
        break;
      }
      case "ArrowRight": {
        Movement.dx[eid] = 1;
        break;
      }
    }
  };

  public getMetrics(): DebugMetrics {
    const movementCount = Movement.dx.filter(Boolean).length;
    const playerCount = Object.keys(Player).length;
    const positionCount = Position.x.filter(Boolean).length;

    return {
      componentCounts: {
        movement: movementCount,
        player: playerCount,
        position: positionCount,
      },
      entityCount: positionCount,
      fps: this.currentFps,
      lastFrameTime: performance.now() - this.lastFrameTime,
      memoryUsage: performance.memory?.usedJSHeapSize ?? 0,
    };
  }

  public cleanup() {
    this.stop();
    globalThis.removeEventListener("resize", this.handleResize);
  }
}
