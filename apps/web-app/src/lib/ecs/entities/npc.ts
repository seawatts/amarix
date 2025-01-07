import type { World } from "bitecs";
import { addComponent, addEntity } from "bitecs";

import {
  Acceleration,
  Animation,
  BattleState,
  Clickable,
  Collidable,
  CollisionMask,
  Debug,
  Force,
  Gravity,
  Health,
  HostileNPC,
  InBattle,
  Movement,
  Named,
  NPC,
  Polygon,
  RigidBody,
  Script,
  Sound,
  Sprite,
  Transform,
  Velocity,
} from "../components";

// Physics scale
const PIXELS_PER_METER = 100; // 1 meter = 100 pixels
const NPC_SIZE = PIXELS_PER_METER; // 1 meter x 1 meter
const INITIAL_HEALTH = 100;
const GRAVITY = 9.81 * PIXELS_PER_METER; // m/s² scaled to pixels
const NPC_MASS = 70; // kg
const NPC_FRICTION = 0.2;
const NPC_RESTITUTION = 0.1;
const NPC_LINEAR_DAMPING = 0.9;
const NPC_ANGULAR_DAMPING = 0.95;
const NPC_FOOTSTEP = "/sounds/npc-footstep.mp3";

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
  const eid = addEntity(world);

  // Add NPC components
  addComponent(
    world,
    eid,
    Transform,
    Movement,
    NPC,
    Health,
    Polygon,
    RigidBody,
    Collidable,
    Clickable,
    Sprite,
    Animation,
    Sound,
    Script,
    Gravity,
    Acceleration,
    Velocity,
    Force,
    Named,
    Debug,
  );

  // Set NPC values
  Transform.x[eid] = options.x;
  Transform.y[eid] = options.y;
  Transform.rotation[eid] = 0;
  Transform.scaleX[eid] = 1;
  Transform.scaleY[eid] = 1;
  Movement.dx[eid] = 0;
  Movement.dy[eid] = 0;
  NPC.eid[eid] = 1;
  Health.current[eid] = INITIAL_HEALTH;
  Health.max[eid] = INITIAL_HEALTH;

  // Set NPC polygon
  const npcBox = createBoxPolygon(NPC_SIZE, NPC_SIZE);
  Polygon.isConvex[eid] = 1;
  Polygon.rotation[eid] = 0;
  Polygon.vertexCount[eid] = 4;
  Polygon.originX[eid] = 0;
  Polygon.originY[eid] = 0;
  Polygon.verticesX[eid] = npcBox.x;
  Polygon.verticesY[eid] = npcBox.y;

  // Set physics values for NPC
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;
  Acceleration.x[eid] = 0;
  Acceleration.y[eid] = 0;
  RigidBody.mass[eid] = NPC_MASS;
  RigidBody.friction[eid] = NPC_FRICTION;
  RigidBody.restitution[eid] = NPC_RESTITUTION;
  RigidBody.isStatic[eid] = 0;
  RigidBody.linearDamping[eid] = NPC_LINEAR_DAMPING;
  RigidBody.angularDamping[eid] = NPC_ANGULAR_DAMPING;
  Gravity.x[eid] = 0;
  Gravity.y[eid] = GRAVITY;

  // Set collision values for NPC
  Collidable.isActive[eid] = 1;
  Collidable.isTrigger[eid] = 0;
  Collidable.layer[eid] = CollisionMask.NPC;
  Collidable.mask[eid] = CollisionMask.Player | CollisionMask.Wall;

  // Set clickable values for NPC
  Clickable.isClicked[eid] = 0;
  Clickable.type[eid] = "npc";

  // Set animation values for NPC
  Animation.currentSequence[eid] = "idle";
  Animation.isPlaying[eid] = 1;
  Animation.isLooping[eid] = 1;
  Animation.timer[eid] = 0;
  Animation.frameDuration[eid] = 500;

  // Set sound values for NPC
  Sound.src[eid] = NPC_FOOTSTEP;
  Sound.isPlaying[eid] = 0;
  Sound.isLooping[eid] = 0;
  Sound.volume[eid] = 0.5;
  Sound.playbackRate[eid] = 1;
  Sound.panX[eid] = 0;
  Sound.panY[eid] = 0;
  Sound.maxDistance[eid] = 500;

  // Set script values for NPC
  Script.isActive[eid] = 1;
  Script.scriptId[eid] = 0;
  Script.state[eid] = 0;
  Script.timer[eid] = 0;

  // Set name
  Named.name[eid] = "NPC";

  return eid;
}

export function createHostileNPC(world: World, options: CreateNPCOptions) {
  const eid = createNPC(world, options);

  // Add hostile NPC components
  addComponent(world, eid, HostileNPC, BattleState, InBattle);

  // Set hostile NPC values
  HostileNPC.eid[eid] = 1;
  HostileNPC.isHostile[eid] = 1;
  BattleState.isActive[eid] = 0;
  BattleState.turn[eid] = 0;
  BattleState.enemyPosition.x[eid] = 0;
  BattleState.enemyPosition.y[eid] = 0;
  BattleState.playerPosition.x[eid] = 0;
  BattleState.playerPosition.y[eid] = 0;
  InBattle.eid[eid] = 0;

  // Set name
  Named.name[eid] = "Hostile NPC";

  return eid;
}
