import type { World } from "bitecs";
import { addComponent, addEntity } from "bitecs";

import {
  Acceleration,
  Animation,
  Clickable,
  Collidable,
  CollisionMask,
  Health,
  HostileNPC,
  Hoverable,
  Named,
  NPC,
  Polygon,
  Position,
  RigidBody,
  Sound,
  Sprite,
  Velocity,
} from "../components";

const NPC_SIZE = 100;
const INITIAL_HEALTH = 100;

const NPC_SPRITE = "/sprites/npc.png";
const HOSTILE_NPC_SPRITE = "/sprites/hostile-npc.png";
const NPC_AMBIENT = "/sounds/ambient.mp3";
const HOSTILE_NPC_ATTACK = "/sounds/hostile-attack.mp3";

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

function createBoxPolygon(
  width: number,
  height: number,
): { x: Float32Array; y: Float32Array } {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Create vertices for a box (clockwise order)
  const x = new Float32Array(4);
  const y = new Float32Array(4);

  // Top-left
  x[0] = -halfWidth;
  y[0] = -halfHeight;

  // Top-right
  x[1] = halfWidth;
  y[1] = -halfHeight;

  // Bottom-right
  x[2] = halfWidth;
  y[2] = halfHeight;

  // Bottom-left
  x[3] = -halfWidth;
  y[3] = halfHeight;

  return { x, y };
}

interface CreateNPCOptions {
  x: number;
  y: number;
}

export function createNPC(world: World, options: CreateNPCOptions) {
  const npcEid = addEntity(world);

  // Add NPC components
  addComponent(
    world,
    npcEid,
    Position,
    NPC,
    Health,
    Clickable,
    Hoverable,
    Polygon,
    RigidBody,
    Collidable,
    Sprite,
    Animation,
    Sound,
    Acceleration,
    Velocity,
  );

  // Set NPC values
  Position.x[npcEid] = options.x;
  Position.y[npcEid] = options.y;
  NPC.eid[npcEid] = 1;
  Health.current[npcEid] = INITIAL_HEALTH;
  Health.max[npcEid] = INITIAL_HEALTH;
  Clickable.isClicked[npcEid] = 0;
  Clickable.type[npcEid] = "npc";
  Hoverable.isHovered[npcEid] = 0;
  Hoverable.type[npcEid] = "npc";

  // Set NPC polygon
  const npcBox = createBoxPolygon(NPC_SIZE, NPC_SIZE);
  Polygon.isConvex[npcEid] = 1;
  Polygon.rotation[npcEid] = 0;
  Polygon.vertexCount[npcEid] = 4;
  Polygon.originX[npcEid] = 0;
  Polygon.originY[npcEid] = 0;
  Polygon.verticesX[npcEid] = npcBox.x;
  Polygon.verticesY[npcEid] = npcBox.y;

  // Set default physics values for NPC
  Velocity.x[npcEid] = 0;
  Velocity.y[npcEid] = 0;
  Acceleration.x[npcEid] = 0;
  Acceleration.y[npcEid] = 0;
  RigidBody.mass[npcEid] = 1;
  RigidBody.friction[npcEid] = 0.1;
  RigidBody.restitution[npcEid] = 0.5;

  // Set collision values for NPC
  Collidable.isActive[npcEid] = 1;
  Collidable.isTrigger[npcEid] = 0;
  Collidable.layer[npcEid] = 2; // NPC layer
  Collidable.mask[npcEid] = CollisionMask.NPC;

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

  // Set name
  Named.name[npcEid] = `NPC ${npcEid}`;

  return npcEid;
}

export function createHostileNPC(world: World, options: CreateNPCOptions) {
  const npcEid = addEntity(world);

  // Add NPC components
  addComponent(
    world,
    npcEid,
    Position,
    NPC,
    Health,
    HostileNPC,
    Clickable,
    Hoverable,
    Polygon,
    RigidBody,
    Collidable,
    Sprite,
    Animation,
    Sound,
    Named,
  );

  // Set hostile NPC polygon
  const hostileNpcBox = createBoxPolygon(NPC_SIZE, NPC_SIZE);
  Polygon.isConvex[npcEid] = 1;
  Polygon.rotation[npcEid] = 0;
  Polygon.vertexCount[npcEid] = 4;
  Polygon.originX[npcEid] = 0;
  Polygon.originY[npcEid] = 0;
  Polygon.verticesX[npcEid] = hostileNpcBox.x;
  Polygon.verticesY[npcEid] = hostileNpcBox.y;

  // Set NPC values
  Position.x[npcEid] = options.x;
  Position.y[npcEid] = options.y;
  NPC.eid[npcEid] = 1;
  HostileNPC.isHostile[npcEid] = 1;
  Health.current[npcEid] = INITIAL_HEALTH;
  Health.max[npcEid] = INITIAL_HEALTH;
  Clickable.isClicked[npcEid] = 0;
  Clickable.type[npcEid] = "hostile-npc";
  Hoverable.isHovered[npcEid] = 0;
  Hoverable.type[npcEid] = "hostile-npc";

  // Set default physics values for NPC
  Velocity.x[npcEid] = 0;
  Velocity.y[npcEid] = 0;
  Acceleration.x[npcEid] = 0;
  Acceleration.y[npcEid] = 0;
  RigidBody.mass[npcEid] = 1;
  RigidBody.friction[npcEid] = 0.1;
  RigidBody.restitution[npcEid] = 0.5;

  // Set collision values for NPC
  Collidable.isActive[npcEid] = 1;
  Collidable.isTrigger[npcEid] = 0;
  Collidable.layer[npcEid] = 2; // NPC layer
  Collidable.mask[npcEid] = CollisionMask.NPC;

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

  // Set name
  Named.name[npcEid] = `Hostile NPC ${npcEid}`;

  return npcEid;
}
