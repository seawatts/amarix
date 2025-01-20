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
import { registerAnimation } from "./systems/animation";

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

export function createGameWorld(canvas: HTMLCanvasElement) {
  // Create the world first
  const world = createWorld<WorldProps>({
    prefabs: {
      shape: 0, // Will be replaced with actual prefab ID
    },
    timing: {
      delta: 0,
      lastFrame: 0,
    },
  });

  // Create the shape prefab
  const shapePrefab = addPrefab(world);
  addComponent(world, shapePrefab, Named, Debug);
  world.prefabs.shape = shapePrefab;

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

  // Create player
  const { x: playerX, y: playerY } = getInitialPlayerPosition(canvas);
  const playerEntity = createPlayer(world, { x: playerX, y: playerY });

  // Create NPCs
  const takenPositions = [{ x: playerX, y: playerY }];
  const npcCount = NPC_COUNT - HOSTILE_NPC_COUNT;

  // Create regular NPCs
  for (let index = 0; index < npcCount; index++) {
    const { x, y } = getRandomGridPosition(canvas, takenPositions);
    createNPC(world, { x, y });
    takenPositions.push({ x, y });
  }

  // Create hostile NPCs
  for (let index = 0; index < HOSTILE_NPC_COUNT; index++) {
    const { x, y } = getRandomGridPosition(canvas, takenPositions);
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
    x: canvas.width / 4,
    y: canvas.height / 4,
  });

  // Create scene entity
  createScene(world, { initialScene: "GAME" });

  // Create ground entity
  createGround(world, {
    height: 20,
    // 10 pixels from bottom
    width: canvas.width,
    x: canvas.width / 2,
    y: canvas.height - 10,
  });

  // Create camera targeting the player
  createCamera(world, { x: 1500, y: 1000 });
  // createCamera(world);

  return world;
}
