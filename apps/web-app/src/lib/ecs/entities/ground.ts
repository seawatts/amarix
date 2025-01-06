import type { World } from "bitecs";
import { addComponent, addEntity } from "bitecs";

import {
  Acceleration,
  Collidable,
  CollisionMask,
  Force,
  Named,
  Polygon,
  Position,
  RigidBody,
  Velocity,
} from "../components";

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

interface CreateGroundOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function createGround(world: World, options: CreateGroundOptions) {
  const groundEid = addEntity(world);
  addComponent(
    world,
    groundEid,
    Position,
    Polygon,
    RigidBody,
    Collidable,
    Acceleration,
    Velocity,
    Force,
    Named,
  );

  // Position the ground
  Position.x[groundEid] = options.x;
  Position.y[groundEid] = options.y;

  // Set ground polygon
  const groundBox = createBoxPolygon(options.width, options.height);
  Polygon.isConvex[groundEid] = 1;
  Polygon.rotation[groundEid] = 0;
  Polygon.vertexCount[groundEid] = 4;
  Polygon.originX[groundEid] = 0;
  Polygon.originY[groundEid] = 0;
  Polygon.verticesX[groundEid] = groundBox.x;
  Polygon.verticesY[groundEid] = groundBox.y;

  // Set physics values for ground
  Velocity.x[groundEid] = 0;
  Velocity.y[groundEid] = 0;
  Acceleration.x[groundEid] = 0;
  Acceleration.y[groundEid] = 0;
  RigidBody.mass[groundEid] = 1000; // Very heavy
  RigidBody.friction[groundEid] = 0.3;
  RigidBody.restitution[groundEid] = 0;
  RigidBody.isStatic[groundEid] = 1;
  Force.x[groundEid] = 0;
  Force.y[groundEid] = 0; // No gravity for ground

  // Set collision values for ground
  Collidable.isActive[groundEid] = 1;
  Collidable.isTrigger[groundEid] = 0;
  Collidable.layer[groundEid] = 2; // Ground layer
  Collidable.mask[groundEid] = CollisionMask.Wall;

  // Set name
  Named.name[groundEid] = "Ground";

  return groundEid;
}
