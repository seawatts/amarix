import type { World } from "bitecs";
import { addComponent, pipe } from "bitecs";

import { HostileNPC, InBattle } from "./components";
import { createBattleSystem } from "./systems/battle";
import { createDebugMetricsSystem } from "./systems/debug-metrics";
import { createInputSystem } from "./systems/input";
import { createMovementSystem } from "./systems/movement";
import { createNPCInteractionSystem } from "./systems/npc-interaction";
import { createRenderSystem } from "./systems/render";
import { createGameWorld, createNPCs, createPlayer } from "./world";

const INITIAL_NPC_COUNT = 5;
const INITIAL_HOSTILE_NPC_COUNT = 2;

export class GameEngine {
  public world!: World;
  private pipeline: (world: World) => void;
  private animationFrameId: number | null = null;
  private player: number | null = null;
  private canvas: HTMLCanvasElement;
  private inputSystem!: ReturnType<ReturnType<typeof createInputSystem>>;
  private lastFrameTime = 0;
  private readonly targetFPS = 60;
  private readonly frameInterval = 1000 / 60; // 60 FPS

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Initialize world and systems
    this.world = createGameWorld();
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not get canvas context");
    }

    // Initialize systems
    this.inputSystem = createInputSystem()(this.world);

    // Create pipeline of systems
    this.pipeline = pipe(
      createDebugMetricsSystem(),
      createBattleSystem(),
      createNPCInteractionSystem(),
      createMovementSystem(canvas),
      createRenderSystem(canvas, context),
    );

    // Create initial entities
    this.player = createPlayer(this.world, canvas);
    createNPCs(this.world, canvas, INITIAL_NPC_COUNT);

    // Create hostile NPCs
    for (let index = 0; index < INITIAL_HOSTILE_NPC_COUNT; index++) {
      const [npc] = createNPCs(this.world, canvas, 1);
      if (npc !== undefined) {
        addComponent(this.world, npc, HostileNPC);
        HostileNPC.eid[npc] = 1;
      }
    }
  }

  public start() {
    if (this.animationFrameId !== null) return;
    this.lastFrameTime = performance.now();
    this.gameLoop(performance.now());
  }

  public stop() {
    if (this.animationFrameId === null) return;
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  private gameLoop = (timestamp: number) => {
    // Calculate time since last frame
    const deltaTime = timestamp - this.lastFrameTime;

    // Only update if enough time has passed
    if (deltaTime >= this.frameInterval) {
      // Update last frame time, accounting for any excess time
      this.lastFrameTime = timestamp - (deltaTime % this.frameInterval);

      // Run all systems
      this.pipeline(this.world);
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  public handleKeyDown = (event: KeyboardEvent) => {
    if (!this.player) return;

    if (InBattle.eid[this.player]) {
      this.inputSystem.handleBattleInput(this.player, event);
    } else {
      this.inputSystem.handleExplorationInput(this.player, event);
    }
  };

  public handleKeyUp = (event: KeyboardEvent) => {
    if (!this.player) return;

    if (!InBattle.eid[this.player]) {
      this.inputSystem.handleKeyUp(this.player, event);
    }
  };

  public cleanup() {
    this.stop();
  }
}
