import {
  addComponent,
  addEntity,
  createWorld,
  registerComponent,
} from "bitecs";

import {
  BattleAction,
  BattleState,
  BoundingBox,
  Clickable,
  Collidable,
  CurrentPlayer,
  Health,
  HostileNPC,
  Hoverable,
  InBattle,
  InteractionCooldown,
  KeyboardState,
  MouseState,
  Movement,
  NPC,
  NPCInteraction,
  Physics,
  Player,
  Position,
  TriggerZone,
  ValidActions,
} from "./components";

const CELL_SIZE = 50;
const INITIAL_HEALTH = 100;
const NPC_COUNT = 5;
const HOSTILE_NPC_COUNT = 2;
const PLAYER_SIZE = 40;
const NPC_SIZE = 40;

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

export function createGameWorld(canvas: HTMLCanvasElement) {
  // Create the world first
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
  registerComponent(world, Hoverable);
  registerComponent(world, KeyboardState);
  registerComponent(world, CurrentPlayer);
  registerComponent(world, MouseState);
  registerComponent(world, BoundingBox);
  registerComponent(world, Physics);
  registerComponent(world, Collidable);
  registerComponent(world, TriggerZone);

  // Create player
  const playerEid = addEntity(world);
  const { x: playerX, y: playerY } = getInitialPlayerPosition(canvas);

  // Add player components
  addComponent(world, playerEid, Position);
  addComponent(world, playerEid, Movement);
  addComponent(world, playerEid, Player);
  addComponent(world, playerEid, Health);
  addComponent(world, playerEid, CurrentPlayer);
  addComponent(world, playerEid, KeyboardState);
  addComponent(world, playerEid, MouseState);
  addComponent(world, playerEid, BoundingBox);
  addComponent(world, playerEid, Physics);
  addComponent(world, playerEid, Collidable);

  // Set player values
  Position.x[playerEid] = playerX;
  Position.y[playerEid] = playerY;
  Movement.dx[playerEid] = 0;
  Movement.dy[playerEid] = 0;
  Player.eid[playerEid] = 1;
  Health.current[playerEid] = INITIAL_HEALTH;
  Health.max[playerEid] = INITIAL_HEALTH;
  CurrentPlayer.eid[playerEid] = 1;
  BoundingBox.width[playerEid] = PLAYER_SIZE;
  BoundingBox.height[playerEid] = PLAYER_SIZE;
  // Set default physics values for player
  Physics.velocityX[playerEid] = 0;
  Physics.velocityY[playerEid] = 0;
  Physics.accelerationX[playerEid] = 0;
  Physics.accelerationY[playerEid] = 0;
  Physics.mass[playerEid] = 1;
  Physics.friction[playerEid] = 0.1;
  Physics.elasticity[playerEid] = 0.5;
  // Set collision values for player
  Collidable.type[playerEid] = "solid";
  Collidable.isStatic[playerEid] = 0; // Dynamic object
  Collidable.layer[playerEid] = 1; // Player layer

  // Initialize keyboard state
  KeyboardState.keys[playerEid] = 0;

  // Initialize mouse state
  MouseState.x[playerEid] = 0;
  MouseState.y[playerEid] = 0;
  MouseState.buttonsDown[playerEid] = 0;
  MouseState.hoveredEntity[playerEid] = 0;
  MouseState.clickedEntity[playerEid] = 0;

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
    addComponent(world, npcEid, Clickable);
    addComponent(world, npcEid, Hoverable);
    addComponent(world, npcEid, BoundingBox);
    addComponent(world, npcEid, Physics);
    addComponent(world, npcEid, Collidable);

    // Set NPC values
    Position.x[npcEid] = x;
    Position.y[npcEid] = y;
    NPC.eid[npcEid] = 1;
    Health.current[npcEid] = INITIAL_HEALTH;
    Health.max[npcEid] = INITIAL_HEALTH;
    Clickable.isClicked[npcEid] = 0;
    Clickable.type[npcEid] = "npc";
    Hoverable.isHovered[npcEid] = 0;
    Hoverable.type[npcEid] = "npc";
    BoundingBox.width[npcEid] = NPC_SIZE;
    BoundingBox.height[npcEid] = NPC_SIZE;
    // Set default physics values for NPC
    Physics.velocityX[npcEid] = 0;
    Physics.velocityY[npcEid] = 0;
    Physics.accelerationX[npcEid] = 0;
    Physics.accelerationY[npcEid] = 0;
    Physics.mass[npcEid] = 1;
    Physics.friction[npcEid] = 0.1;
    Physics.elasticity[npcEid] = 0.5;
    // Set collision values for NPC
    Collidable.type[npcEid] = "solid";
    Collidable.isStatic[npcEid] = 1; // Static object
    Collidable.layer[npcEid] = 2; // NPC layer

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
    addComponent(world, npcEid, Clickable);
    addComponent(world, npcEid, Hoverable);
    addComponent(world, npcEid, BoundingBox);
    addComponent(world, npcEid, Physics);
    addComponent(world, npcEid, Collidable);

    // Set NPC values
    Position.x[npcEid] = x;
    Position.y[npcEid] = y;
    NPC.eid[npcEid] = 1;
    HostileNPC.isHostile[npcEid] = 1;
    Health.current[npcEid] = INITIAL_HEALTH;
    Health.max[npcEid] = INITIAL_HEALTH;
    Clickable.isClicked[npcEid] = 0;
    Clickable.type[npcEid] = "hostile-npc";
    Hoverable.isHovered[npcEid] = 0;
    Hoverable.type[npcEid] = "hostile-npc";
    BoundingBox.width[npcEid] = NPC_SIZE;
    BoundingBox.height[npcEid] = NPC_SIZE;
    // Set default physics values for NPC
    Physics.velocityX[npcEid] = 0;
    Physics.velocityY[npcEid] = 0;
    Physics.accelerationX[npcEid] = 0;
    Physics.accelerationY[npcEid] = 0;
    Physics.mass[npcEid] = 1;
    Physics.friction[npcEid] = 0.1;
    Physics.elasticity[npcEid] = 0.5;
    // Set collision values for NPC
    Collidable.type[npcEid] = "solid";
    Collidable.isStatic[npcEid] = 1; // Static object
    Collidable.layer[npcEid] = 2; // NPC layer

    takenPositions.push({ x, y });
  }

  // Example: Create a battle trigger zone
  const triggerEid = addEntity(world);
  const x = canvas.width / 4;
  const y = canvas.height / 4;
  const width = CELL_SIZE * 2;
  const height = CELL_SIZE * 2;
  const battleId = 1;

  addComponent(world, triggerEid, Position);
  addComponent(world, triggerEid, BoundingBox);
  addComponent(world, triggerEid, Collidable);
  addComponent(world, triggerEid, TriggerZone);

  // Set up the trigger zone
  Position.x[triggerEid] = x;
  Position.y[triggerEid] = y;
  BoundingBox.width[triggerEid] = width;
  BoundingBox.height[triggerEid] = height;
  Collidable.type[triggerEid] = "trigger";
  Collidable.isStatic[triggerEid] = 1;
  Collidable.layer[triggerEid] = 4; // Trigger layer

  TriggerZone.type[triggerEid] = "battle";
  TriggerZone.actionId[triggerEid] = battleId;
  TriggerZone.isRepeatable[triggerEid] = 0;
  TriggerZone.cooldown[triggerEid] = 0;

  return world;
}
