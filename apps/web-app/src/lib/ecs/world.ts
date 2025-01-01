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
  DebugMetrics,
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

function getInitialPlayerPosition(canvas: HTMLCanvasElement) {
  return {
    x: canvas.width / 2,
    y: canvas.height / 2,
  };
}

export function createGameWorld() {
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
  registerComponent(world, DebugMetrics);
  registerComponent(world, Clickable);

  // Create and initialize debug metrics entity
  const metricsEntity = addEntity(world);
  addComponent(world, metricsEntity, DebugMetrics);

  return world;
}

export function createPlayer(
  world: ReturnType<typeof createWorld>,
  canvas: HTMLCanvasElement,
) {
  const eid = addEntity(world);
  const { x, y } = getInitialPlayerPosition(canvas);

  // First add all components to the entity
  addComponent(world, eid, Position);
  addComponent(world, eid, Movement);
  addComponent(world, eid, Player);
  addComponent(world, eid, Health);

  // Then set their values
  Position.x[eid] = x;
  Position.y[eid] = y;
  Movement.dx[eid] = 0;
  Movement.dy[eid] = 0;
  Player.eid[eid] = 1;
  Health.current[eid] = INITIAL_HEALTH;
  Health.max[eid] = INITIAL_HEALTH;

  return eid;
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

export function createNPCs(
  world: ReturnType<typeof createWorld>,
  canvas: HTMLCanvasElement,
  count: number,
): number[] {
  const { x: playerX, y: playerY } = getInitialPlayerPosition(canvas);
  const takenPositions: { x: number; y: number }[] = [
    { x: playerX, y: playerY }, // Player's position
  ];

  const createdEntities: number[] = [];

  for (let index = 0; index < count; index++) {
    const eid = addEntity(world);

    // Get random position that doesn't overlap with other entities
    const { x, y } = getRandomGridPosition(canvas, takenPositions);

    // First add all components to the entity
    addComponent(world, eid, Position);
    addComponent(world, eid, NPC);
    addComponent(world, eid, Health);

    // Then set their values
    Position.x[eid] = x;
    Position.y[eid] = y;
    NPC.eid[eid] = 1;
    Health.current[eid] = INITIAL_HEALTH;
    Health.max[eid] = INITIAL_HEALTH;

    takenPositions.push({ x, y });
    createdEntities.push(eid);
  }

  return createdEntities;
}
