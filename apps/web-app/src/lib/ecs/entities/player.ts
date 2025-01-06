import type { World } from "bitecs";
import { addComponent, addEntity } from "bitecs";

import {
  Acceleration,
  Animation,
  Clickable,
  Collidable,
  CollisionMask,
  CurrentPlayer,
  Force,
  Gravity,
  Health,
  KeyboardState,
  MouseState,
  Movement,
  Named,
  Player,
  Polygon,
  Position,
  RigidBody,
  Sound,
  Sprite,
  Velocity,
} from "../components";

const PLAYER_SIZE = 100;
const INITIAL_HEALTH = 100;
const GRAVITY = 9.81; // m/s²
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
    Position,
    Movement,
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
  );
  Clickable.isClicked[playerEid] = 0;
  // Set player values
  Position.x[playerEid] = options.x;
  Position.y[playerEid] = options.y;
  Movement.dx[playerEid] = 0;
  Movement.dy[playerEid] = 0;
  Player.eid[playerEid] = 1;
  Health.current[playerEid] = INITIAL_HEALTH;
  Health.max[playerEid] = INITIAL_HEALTH;
  CurrentPlayer.eid[playerEid] = 1;
  Force.x[playerEid] = 0;
  Force.y[playerEid] = 0;

  // Set player polygon
  const playerBox = createBoxPolygon(PLAYER_SIZE, PLAYER_SIZE);
  Polygon.isConvex[playerEid] = 1;
  Polygon.rotation[playerEid] = 0;
  Polygon.vertexCount[playerEid] = 4;
  Polygon.originX[playerEid] = 0;
  Polygon.originY[playerEid] = 0;
  Polygon.verticesX[playerEid] = playerBox.x;
  Polygon.verticesY[playerEid] = playerBox.y;

  // Set physics values for player
  Velocity.x[playerEid] = 0;
  Velocity.y[playerEid] = 0;
  Acceleration.x[playerEid] = 0;
  Acceleration.y[playerEid] = 0;
  RigidBody.mass[playerEid] = 70;
  RigidBody.friction[playerEid] = 0;
  RigidBody.restitution[playerEid] = 0;
  RigidBody.isStatic[playerEid] = 0;
  Gravity.x[playerEid] = 0;
  Gravity.y[playerEid] = GRAVITY;

  // Set collision values for player
  Collidable.isActive[playerEid] = 1;
  Collidable.isTrigger[playerEid] = 0;
  Collidable.layer[playerEid] = 1; // Player layer
  Collidable.mask[playerEid] = CollisionMask.Player;

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
  Force.x[playerEid] = 0;
  Force.y[playerEid] = GRAVITY; // Apply gravity force

  // Set name
  Named.name[playerEid] = "Player";

  return playerEid;
}
