import type { World } from "bitecs";
import { addComponent, addEntity } from "bitecs";

import {
  Acceleration,
  Animation,
  Clickable,
  Collidable,
  CollisionMask,
  CurrentPlayer,
  Debug,
  Force,
  Gravity,
  Health,
  KeyboardState,
  MouseState,
  Named,
  Player,
  Polygon,
  RigidBody,
  Sound,
  Sprite,
  Transform,
  Velocity,
} from "../components";
import { createDebug } from "./debug";

// Physics scale
const PIXELS_PER_METER = 100; // 1 meter = 100 pixels

// Player dimensions (1 meter x 1 meter)
const PLAYER_SIZE = PIXELS_PER_METER;

// Physics constants
const GRAVITY = 9.81 * PIXELS_PER_METER; // m/s² scaled to pixels
const PLAYER_MASS = 70; // kg
const PLAYER_FRICTION = 0.2; // Increased friction for better control
const PLAYER_RESTITUTION = 0.1; // Reduced bounciness
const PLAYER_LINEAR_DAMPING = 0.9; // Increased air resistance for better control
const PLAYER_ANGULAR_DAMPING = 0.95; // Increased rotational resistance

// Game constants
const INITIAL_HEALTH = 100;
const PLAYER_FOOTSTEP = "/sounds/footstep.mp3";

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

interface CreatePlayerOptions {
  x: number;
  y: number;
}

export function createPlayer(world: World, options: CreatePlayerOptions) {
  const playerEid = addEntity(world);

  // Add player components
  addComponent(
    world,
    playerEid,
    Transform,
    Player,
    Health,
    CurrentPlayer,
    KeyboardState,
    MouseState,
    Polygon,
    RigidBody,
    Collidable,
    Clickable,
    Sprite,
    Animation,
    Sound,
    Gravity,
    Acceleration,
    Velocity,
    Force,
    Named,
    Debug,
  );

  // Set player values
  Transform.x[playerEid] = options.x;
  Transform.y[playerEid] = options.y;
  Transform.rotation[playerEid] = 0;
  Transform.scaleX[playerEid] = 1;
  Transform.scaleY[playerEid] = 1;
  Player.eid[playerEid] = 1;
  Health.current[playerEid] = INITIAL_HEALTH;
  Health.max[playerEid] = INITIAL_HEALTH;
  CurrentPlayer.eid[playerEid] = 1;

  // Set physics values for player
  Velocity.x[playerEid] = 0;
  Velocity.y[playerEid] = 0;
  Acceleration.x[playerEid] = 0;
  Acceleration.y[playerEid] = 0;
  Force.x[playerEid] = 0;
  Force.y[playerEid] = 0;
  RigidBody.mass[playerEid] = PLAYER_MASS;
  RigidBody.friction[playerEid] = PLAYER_FRICTION;
  RigidBody.restitution[playerEid] = PLAYER_RESTITUTION;
  RigidBody.isStatic[playerEid] = 0;
  RigidBody.linearDamping[playerEid] = PLAYER_LINEAR_DAMPING;
  RigidBody.angularDamping[playerEid] = PLAYER_ANGULAR_DAMPING;
  Gravity.x[playerEid] = 0;
  Gravity.y[playerEid] = GRAVITY;

  // Set player polygon
  const playerBox = createBoxPolygon(PLAYER_SIZE, PLAYER_SIZE);
  Polygon.isConvex[playerEid] = 1;
  Polygon.rotation[playerEid] = 0;
  Polygon.vertexCount[playerEid] = 4;
  Polygon.originX[playerEid] = 0;
  Polygon.originY[playerEid] = 0;
  Polygon.verticesX[playerEid] = playerBox.x;
  Polygon.verticesY[playerEid] = playerBox.y;

  // Set collision values for player
  Collidable.isActive[playerEid] = 1;
  Collidable.isTrigger[playerEid] = 0;
  Collidable.layer[playerEid] = CollisionMask.Player;
  Collidable.mask[playerEid] =
    CollisionMask.Wall |
    CollisionMask.NPC |
    CollisionMask.Item |
    CollisionMask.Trigger;

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

  // Set name
  Named.name[playerEid] = "Player";
  createDebug(playerEid);

  return playerEid;
}
