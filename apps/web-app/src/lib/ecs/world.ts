import {
  addComponent,
  addEntity,
  createWorld,
  registerComponent,
} from "bitecs";

import {
  BattleAction,
  BattleState,
  Clickable,
  Health,
  HostileNPC,
  InBattle,
  InteractionCooldown,
  Movement,
  NPC,
  NPCInteraction,
  Player,
  Position,
  ValidActions,
} from "./components";

const CELL_SIZE = 50;
const INITIAL_HEALTH = 100;
const NPC_COUNT = 5;
const HOSTILE_NPC_COUNT = 2;

interface GameWorldState {
  world: ReturnType<typeof createWorld>;
  playerEid: number;
}

function getInitialPlayerPosition(canvas: HTMLCanvasElement) {
  return {
    x: canvas.width / 2,
    y: canvas.height / 2,
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

export function createGameWorld(canvas: HTMLCanvasElement): GameWorldState {
  const world = createWorld();

  // Register components with the world
  registerComponent(world, Position);
  registerComponent(world, Movement);
  registerComponent(world, Player);
  registerComponent(world, NPC);
  registerComponent(world, Health);
  registerComponent(world, HostileNPC);
  registerComponent(world, NPCInteraction);
  registerComponent(world, InteractionCooldown);
  registerComponent(world, BattleState);
  registerComponent(world, InBattle);
  registerComponent(world, BattleAction);
  registerComponent(world, ValidActions);
  registerComponent(world, Clickable);

  // Create player
  const playerEid = addEntity(world);
  const { x: playerX, y: playerY } = getInitialPlayerPosition(canvas);

  // Add player components
  addComponent(world, playerEid, Position);
  addComponent(world, playerEid, Movement);
  addComponent(world, playerEid, Player);
  addComponent(world, playerEid, Health);

  // Set player values
  Position.x[playerEid] = playerX;
  Position.y[playerEid] = playerY;
  Movement.dx[playerEid] = 0;
  Movement.dy[playerEid] = 0;
  Player.eid[playerEid] = 1;
  Health.current[playerEid] = INITIAL_HEALTH;
  Health.max[playerEid] = INITIAL_HEALTH;

  // Create NPCs
  const takenPositions = [{ x: playerX, y: playerY }];
  const npcCount = NPC_COUNT - HOSTILE_NPC_COUNT;

  // Create regular NPCs
  for (let index = 0; index < npcCount; index++) {
    const npcEid = addEntity(world);
    const { x, y } = getRandomGridPosition(canvas, takenPositions);

    // Add NPC components
    addComponent(world, npcEid, Position);
    addComponent(world, npcEid, NPC);
    addComponent(world, npcEid, Health);

    // Set NPC values
    Position.x[npcEid] = x;
    Position.y[npcEid] = y;
    NPC.eid[npcEid] = 1;
    Health.current[npcEid] = INITIAL_HEALTH;
    Health.max[npcEid] = INITIAL_HEALTH;

    takenPositions.push({ x, y });
  }

  // Create hostile NPCs
  for (let index = 0; index < HOSTILE_NPC_COUNT; index++) {
    const npcEid = addEntity(world);
    const { x, y } = getRandomGridPosition(canvas, takenPositions);

    // Add NPC components
    addComponent(world, npcEid, Position);
    addComponent(world, npcEid, NPC);
    addComponent(world, npcEid, Health);
    addComponent(world, npcEid, HostileNPC);

    // Set NPC values
    Position.x[npcEid] = x;
    Position.y[npcEid] = y;
    NPC.eid[npcEid] = 1;
    HostileNPC.isHostile[npcEid] = 1;
    Health.current[npcEid] = INITIAL_HEALTH;
    Health.max[npcEid] = INITIAL_HEALTH;

    takenPositions.push({ x, y });
  }

  return { playerEid, world };
}
