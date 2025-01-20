import { addComponent, addPrefab, createWorld } from "bitecs";

import type { WorldProps } from "./types";
import { Debug, Named } from "./components";
import {
  createCamera,
  createGround,
  createHostileNPC,
  createNPC,
  createPlayer,
  createScene,
  createTriggerZone,
} from "./entities";
import { createAnimationSystem, registerAnimation } from "./systems/animation";
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

const CELL_SIZE = 50;
const NPC_COUNT = 5;
const HOSTILE_NPC_COUNT = 2;

// Animation sequences
const PLAYER_ANIMATIONS = {
  idle: {
    frameDuration: 200,
    frames: [0, 1, 2, 3],
    isLooping: true,
  },
  walk: {
    frameDuration: 150,
    frames: [4, 5, 6, 7],
    isLooping: true,
  },
};

const NPC_ANIMATIONS = {
  idle: {
    frameDuration: 500,
    frames: [0, 1],
    isLooping: true,
  },
};

const HOSTILE_NPC_ANIMATIONS = {
  attack: {
    frameDuration: 100,
    frames: [3, 4, 5],
    isLooping: false,
  },
  idle: {
    frameDuration: 300,
    frames: [0, 1, 2],
    isLooping: true,
  },
};

function getInitialPlayerPosition(canvas: HTMLCanvasElement) {
  return {
    x: Math.floor(canvas.width / 2),
    y: Math.floor(canvas.height / 2),
  };
}

function getRandomGridPosition(
  canvas: HTMLCanvasElement,
  excludePositions: { x: number; y: number }[] = [],
) {
  const cols = Math.floor(canvas.width / CELL_SIZE);
  const rows = Math.floor(canvas.height / CELL_SIZE);

  while (true) {
    const x = Math.floor(Math.random() * cols) * CELL_SIZE + CELL_SIZE / 2;
    const y = Math.floor(Math.random() * rows) * CELL_SIZE + CELL_SIZE / 2;

    // Check if position is already taken
    const isTaken = excludePositions.some((pos) => pos.x === x && pos.y === y);

    if (!isTaken) {
      return { x, y };
    }
  }
}

export const initialGameWorldState: WorldProps = {
  canvas: undefined,
  components: [],
  isPaused: false,
  prefabs: {
    shape: 0,
  },
  systems: [],
  timing: {
    delta: 0,
    lastFrame: 0,
  },
};

export function createGameWorld(options: { canvas?: HTMLCanvasElement } = {}) {
  const world = createWorld<WorldProps>();

  if (options.canvas) {
    const context = options.canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get canvas context");
    }
    world.canvas = {
      context,
      element: options.canvas,
    };
  }

  // Initialize systems based on what's available
  const systems = [
    { name: "keyboard", system: createKeyboardSystem() },
    { name: "physics", system: createPhysicsSystem() },
    { name: "trigger", system: createTriggerSystem() },
    { name: "script", system: createScriptSystem() },
    { name: "sprite", system: createSpriteSystem() },
    { name: "animation", system: createAnimationSystem() },
    { name: "sound", system: createSoundSystem() },
    { name: "particle", system: createParticleSystem() },
    { name: "scene", system: createSceneSystem() },
  ];

  // Add canvas-dependent systems only if canvas is available
  if (world.canvas) {
    systems.push(
      { name: "mouse", system: createMouseSystem(world.canvas.element) },
      { name: "movement", system: createMovementSystem(world.canvas.element) },
      { name: "camera", system: createCameraSystem() },
      { name: "render", system: createRenderSystem() },
    );
  }

  world.systems = systems;

  // Create the shape prefab
  const shapePrefab = addPrefab(world);
  addComponent(world, shapePrefab, Named, Debug);
  world.prefabs.shape = shapePrefab;

  if (world.canvas) {
    // Register animations
    for (const [name, sequence] of Object.entries(PLAYER_ANIMATIONS)) {
      registerAnimation("/sprites/player.png", name, sequence);
    }
    for (const [name, sequence] of Object.entries(NPC_ANIMATIONS)) {
      registerAnimation("/sprites/npc.png", name, sequence);
    }
    for (const [name, sequence] of Object.entries(HOSTILE_NPC_ANIMATIONS)) {
      registerAnimation("/sprites/hostile-npc.png", name, sequence);
    }

    // Create entities that require canvas dimensions
    const { x: playerX, y: playerY } = getInitialPlayerPosition(
      world.canvas.element,
    );
    const _playerEntity = createPlayer(world, { x: playerX, y: playerY });

    // Create NPCs
    const takenPositions = [{ x: playerX, y: playerY }];
    const npcCount = NPC_COUNT - HOSTILE_NPC_COUNT;

    // Create regular NPCs
    for (let index = 0; index < npcCount; index++) {
      const { x, y } = getRandomGridPosition(
        world.canvas.element,
        takenPositions,
      );
      createNPC(world, { x, y });
      takenPositions.push({ x, y });
    }

    // Create hostile NPCs
    for (let index = 0; index < HOSTILE_NPC_COUNT; index++) {
      const { x, y } = getRandomGridPosition(
        world.canvas.element,
        takenPositions,
      );
      createHostileNPC(world, { x, y });
      takenPositions.push({ x, y });
    }

    // Create a battle trigger zone
    createTriggerZone(world, {
      actionId: 1,
      cooldown: 0,
      height: CELL_SIZE * 2,
      isRepeatable: false,
      type: "battle",
      width: CELL_SIZE * 2,
      x: world.canvas.element.width / 4,
      y: world.canvas.element.height / 4,
    });

    // Create ground entity
    createGround(world, {
      height: 20,
      // 10 pixels from bottom
      width: world.canvas.element.width,
      x: world.canvas.element.width / 2,
      y: world.canvas.element.height - 10,
    });

    // Create camera targeting the player
    createCamera(world, { x: 1500, y: 1000 });
  }

  // Create scene entity (not canvas dependent)
  createScene(world, { initialScene: "GAME" });

  return world;
}
