import {
  addComponent,
  addEntity,
  createWorld,
  registerComponent,
} from "bitecs";

import {
  Animation,
  BattleAction,
  BattleState,
  BoundingBox,
  Clickable,
  Collidable,
  CurrentPlayer,
  Force,
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
  Particle,
  ParticleEmitter,
  Physics,
  Player,
  Position,
  Scene,
  Script,
  Sound,
  Sprite,
  TriggerZone,
  ValidActions,
} from "./components";
import { registerAnimation } from "./systems/animation";
import { SCENES } from "./systems/scene";

const CELL_SIZE = 50;
const INITIAL_HEALTH = 100;
const NPC_COUNT = 5;
const HOSTILE_NPC_COUNT = 2;
const PLAYER_SIZE = 40;
const NPC_SIZE = 40;
const GRAVITY = 9.81; // m/s²

// Asset paths
const PLAYER_SPRITE = "/sprites/player.png";
const NPC_SPRITE = "/sprites/npc.png";
const HOSTILE_NPC_SPRITE = "/sprites/hostile-npc.png";

// Sound paths
const PLAYER_FOOTSTEP = "/sounds/footstep.mp3";
const _PLAYER_ATTACK = "/sounds/attack.mp3";
const NPC_AMBIENT = "/sounds/ambient.mp3";
const HOSTILE_NPC_ATTACK = "/sounds/hostile-attack.mp3";

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
  registerComponent(world, Script);
  registerComponent(world, Sprite);
  registerComponent(world, Animation);
  registerComponent(world, Sound);
  registerComponent(world, Scene);
  registerComponent(world, Particle);
  registerComponent(world, ParticleEmitter);
  registerComponent(world, Force);

  // Register animations
  for (const [name, sequence] of Object.entries(PLAYER_ANIMATIONS)) {
    registerAnimation(PLAYER_SPRITE, name, sequence);
  }
  for (const [name, sequence] of Object.entries(NPC_ANIMATIONS)) {
    registerAnimation(NPC_SPRITE, name, sequence);
  }
  for (const [name, sequence] of Object.entries(HOSTILE_NPC_ANIMATIONS)) {
    registerAnimation(HOSTILE_NPC_SPRITE, name, sequence);
  }

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
  addComponent(world, playerEid, Sprite);
  addComponent(world, playerEid, Animation);
  addComponent(world, playerEid, Sound);
  addComponent(world, playerEid, Force);

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

  // Set physics values for player
  Physics.velocityX[playerEid] = 0;
  Physics.velocityY[playerEid] = 0;
  Physics.accelerationX[playerEid] = 0;
  Physics.accelerationY[playerEid] = 0;
  Physics.mass[playerEid] = 1;
  Physics.friction[playerEid] = 0.1;
  Physics.restitution[playerEid] = 0.3;
  Physics.isKinematic[playerEid] = 1;
  Physics.isStatic[playerEid] = 0;
  Force.forceX[playerEid] = 0;
  Force.forceY[playerEid] = GRAVITY; // Apply gravity force

  // Set collision values for player
  Collidable.isActive[playerEid] = 1;
  Collidable.isTrigger[playerEid] = 0;
  Collidable.layer[playerEid] = 1; // Player layer
  Collidable.mask[playerEid] = 0xff_ff_ff_ff; // Collide with everything

  // Initialize keyboard state
  KeyboardState.keys[playerEid] = 0;

  // Initialize mouse state
  MouseState.x[playerEid] = 0;
  MouseState.y[playerEid] = 0;
  MouseState.buttonsDown[playerEid] = 0;
  MouseState.hoveredEntity[playerEid] = 0;
  MouseState.clickedEntity[playerEid] = 0;

  // Set animation values for player
  Animation.currentSequence[playerEid] = "idle";
  Animation.isPlaying[playerEid] = 1;
  Animation.isLooping[playerEid] = 1;
  Animation.timer[playerEid] = 0;
  Animation.frameDuration[playerEid] = PLAYER_ANIMATIONS.idle.frameDuration;

  // Set sound values for player
  Sound.src[playerEid] = PLAYER_FOOTSTEP;
  Sound.isPlaying[playerEid] = 0;
  Sound.isLooping[playerEid] = 0;
  Sound.volume[playerEid] = 0.5;
  Sound.playbackRate[playerEid] = 1;
  Sound.panX[playerEid] = 0;
  Sound.panY[playerEid] = 0;
  Sound.maxDistance[playerEid] = 500;
  Force.forceX[playerEid] = 0;
  Force.forceY[playerEid] = GRAVITY; // Apply gravity force

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
    addComponent(world, npcEid, Sprite);
    addComponent(world, npcEid, Animation);
    addComponent(world, npcEid, Sound);

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
    Physics.restitution[npcEid] = 0.5;
    // Set collision values for NPC
    Collidable.isActive[npcEid] = 1;
    Collidable.isTrigger[npcEid] = 0;
    Collidable.layer[npcEid] = 2; // NPC layer
    Collidable.mask[npcEid] = 0xff_ff_ff_ff;
    // Set sprite values for NPC
    Sprite.src[npcEid] = NPC_SPRITE;
    Sprite.frameWidth[npcEid] = NPC_SIZE;
    Sprite.frameHeight[npcEid] = NPC_SIZE;
    Sprite.frame[npcEid] = 0;
    Sprite.isVisible[npcEid] = 1;
    Sprite.isFlipped[npcEid] = 0;
    Sprite.opacity[npcEid] = 1;
    Sprite.rotation[npcEid] = 0;
    Sprite.scaleX[npcEid] = 1;
    Sprite.scaleY[npcEid] = 1;
    Sprite.offsetX[npcEid] = 0;
    Sprite.offsetY[npcEid] = 0;

    // Set animation values for NPC
    Animation.currentSequence[npcEid] = "idle";
    Animation.isPlaying[npcEid] = 1;
    Animation.isLooping[npcEid] = 1;
    Animation.timer[npcEid] = 0;
    Animation.frameDuration[npcEid] = NPC_ANIMATIONS.idle.frameDuration;

    // Set sound values for NPC
    Sound.src[npcEid] = NPC_AMBIENT;
    Sound.isPlaying[npcEid] = 1;
    Sound.isLooping[npcEid] = 1;
    Sound.volume[npcEid] = 0.3;
    Sound.playbackRate[npcEid] = 1;
    Sound.panX[npcEid] = 0;
    Sound.panY[npcEid] = 0;
    Sound.maxDistance[npcEid] = 300;

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
    addComponent(world, npcEid, Sprite);
    addComponent(world, npcEid, Animation);
    addComponent(world, npcEid, Sound);

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
    Physics.restitution[npcEid] = 0.5;
    // Set collision values for NPC
    Collidable.isActive[npcEid] = 1;
    Collidable.isTrigger[npcEid] = 0;
    Collidable.layer[npcEid] = 2; // NPC layer
    Collidable.mask[npcEid] = 0xff_ff_ff_ff;
    // Set sprite values for hostile NPC
    Sprite.src[npcEid] = HOSTILE_NPC_SPRITE;
    Sprite.frameWidth[npcEid] = NPC_SIZE;
    Sprite.frameHeight[npcEid] = NPC_SIZE;
    Sprite.frame[npcEid] = 0;
    Sprite.isVisible[npcEid] = 1;
    Sprite.isFlipped[npcEid] = 0;
    Sprite.opacity[npcEid] = 1;
    Sprite.rotation[npcEid] = 0;
    Sprite.scaleX[npcEid] = 1;
    Sprite.scaleY[npcEid] = 1;
    Sprite.offsetX[npcEid] = 0;
    Sprite.offsetY[npcEid] = 0;

    // Set animation values for NPC
    Animation.currentSequence[npcEid] = "idle";
    Animation.isPlaying[npcEid] = 1;
    Animation.isLooping[npcEid] = 1;
    Animation.timer[npcEid] = 0;
    Animation.frameDuration[npcEid] = HOSTILE_NPC_ANIMATIONS.idle.frameDuration;

    // Set sound values for NPC
    Sound.src[npcEid] = HOSTILE_NPC_ATTACK;
    Sound.isPlaying[npcEid] = 0;
    Sound.isLooping[npcEid] = 0;
    Sound.volume[npcEid] = 0.7;
    Sound.playbackRate[npcEid] = 1;
    Sound.panX[npcEid] = 0;
    Sound.panY[npcEid] = 0;
    Sound.maxDistance[npcEid] = 400;

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
  Collidable.isActive[triggerEid] = 1;
  Collidable.isTrigger[triggerEid] = 1;
  Collidable.layer[triggerEid] = 4; // Trigger layer
  Collidable.mask[triggerEid] = 0xff_ff_ff_ff;

  TriggerZone.type[triggerEid] = "battle";
  TriggerZone.actionId[triggerEid] = battleId;
  TriggerZone.isRepeatable[triggerEid] = 0;
  TriggerZone.cooldown[triggerEid] = 0;

  // Create scene entity
  const sceneEid = addEntity(world);
  addComponent(world, sceneEid, Scene);
  Scene.current[sceneEid] = SCENES.GAME;
  Scene.next[sceneEid] = "";
  Scene.isTransitioning[sceneEid] = 0;
  Scene.transitionProgress[sceneEid] = 0;
  Scene.data[sceneEid] = {};

  // Create ground entity
  const groundEid = addEntity(world);
  addComponent(world, groundEid, Position);
  addComponent(world, groundEid, BoundingBox);
  addComponent(world, groundEid, Physics);
  addComponent(world, groundEid, Collidable);

  // Position the ground at the bottom of the canvas
  Position.x[groundEid] = canvas.width / 2;
  Position.y[groundEid] = canvas.height - 10; // 10 pixels from bottom
  BoundingBox.width[groundEid] = canvas.width;
  BoundingBox.height[groundEid] = 20;

  // Set physics values for ground
  Physics.velocityX[groundEid] = 0;
  Physics.velocityY[groundEid] = 0;
  Physics.accelerationX[groundEid] = 0;
  Physics.accelerationY[groundEid] = 0;
  Physics.mass[groundEid] = 1000; // Very heavy
  Physics.friction[groundEid] = 0.3;
  Physics.restitution[groundEid] = 0;
  Physics.isKinematic[groundEid] = 1;
  Physics.isStatic[groundEid] = 1;
  Force.forceX[groundEid] = 0;
  Force.forceY[groundEid] = 0; // No gravity for ground

  // Set collision values for ground
  Collidable.isActive[groundEid] = 1;
  Collidable.isTrigger[groundEid] = 0;
  Collidable.layer[groundEid] = 2; // Ground layer
  Collidable.mask[groundEid] = 0xff_ff_ff_ff; // Collide with everything

  return world;
}
