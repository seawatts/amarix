import { addComponent, addPrefab, createWorld } from "bitecs";

import type { WorldProps } from "./types";
import { Named } from "./components";
import {
  createCamera,
  createDebug,
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

function getInitialPlayerPosition(worldWidth: number, worldHeight: number) {
  return {
    x: Math.floor(worldWidth / 2),
    y: Math.floor(worldHeight / 2),
  };
}

function getRandomGridPosition(
  worldWidth: number,
  worldHeight: number,
  excludePositions: { x: number; y: number }[] = [],
) {
  const cols = Math.floor(worldWidth / CELL_SIZE);
  const rows = Math.floor(worldHeight / CELL_SIZE);

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
  components: [],
  isPaused: false,
  prefabs: {
    shape: 0,
  },
  timing: {
    delta: 0,
    lastFrame: 0,
  },
};

export function createGameWorld(
  initialState: WorldProps = initialGameWorldState,
) {
  const world = createWorld<WorldProps>(initialState);
  const worldWidth = 1000;
  const worldHeight = 1000;

  // Create the shape prefab
  const shapePrefab = addPrefab(world);
  addComponent(world, shapePrefab, Named);
  Named.name[shapePrefab] = "Shape";
  createDebug(world, shapePrefab);

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

  // Create entities that require canvas dimensions
  const { x: playerX, y: playerY } = getInitialPlayerPosition(
    worldWidth,
    worldHeight,
  );
  const _playerEntity = createPlayer(world, { x: playerX, y: playerY });

  // Create NPCs
  const takenPositions = [{ x: playerX, y: playerY }];
  const npcCount = NPC_COUNT - HOSTILE_NPC_COUNT;

  // Create regular NPCs
  for (let index = 0; index < npcCount; index++) {
    const { x, y } = getRandomGridPosition(
      worldWidth,
      worldHeight,
      takenPositions,
    );
    createNPC(world, { x, y });
    takenPositions.push({ x, y });
  }

  // Create hostile NPCs
  for (let index = 0; index < HOSTILE_NPC_COUNT; index++) {
    const { x, y } = getRandomGridPosition(
      worldWidth,
      worldHeight,
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
    x: worldWidth / 4,
    y: worldHeight / 4,
  });

  // Create ground entity
  createGround(world, {
    height: 20,
    // 10 pixels from bottom
    width: worldWidth * 2,
    x: worldWidth / 2,
    y: worldHeight - 10,
  });

  // Create camera targeting the player
  createCamera(world, {
    target: _playerEntity,
    // x: worldWidth / 2,
    // y: worldHeight / 2,
  });

  // Create scene entity (not canvas dependent)
  createScene(world, { initialScene: "GAME" });

  return world;
}
