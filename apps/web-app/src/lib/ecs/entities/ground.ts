import { addComponent, addEntity, IsA } from "bitecs";

import type { World } from "../types";
import {
  Collidable,
  CollisionMask,
  Named,
  Polygon,
  RigidBody,
  SaveableMapEntity,
  Style,
  Transform,
} from "../components";
import { createDebug } from "./debug";

interface CreateGroundOptions {
  height: number;
  width: number;
  x: number;
  y: number;
}

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

export function createGround(world: World, options: CreateGroundOptions) {
  const eid = addEntity(world);

  // Add ground components
  addComponent(
    world,
    eid,
    Transform,
    Polygon,
    RigidBody,
    Collidable,
    Named,
    Style,
    IsA(world.prefabs.shape),
    SaveableMapEntity,
  );

  // Set transform values
  Transform.x[eid] = options.x;
  Transform.y[eid] = options.y;
  Transform.rotation[eid] = 0;
  Transform.scaleX[eid] = 1;
  Transform.scaleY[eid] = 1;

  // Set style values
  Style.fillColor[eid] = "#666666";
  Style.strokeColor[eid] = "#333333";
  Style.strokeWidth[eid] = 2;
  Style.fillOpacity[eid] = 1;

  // Set ground polygon
  const groundBox = createBoxPolygon(options.width, options.height);
  Polygon.isConvex[eid] = 1;
  Polygon.rotation[eid] = 0;
  Polygon.vertexCount[eid] = 4;
  Polygon.originX[eid] = 0;
  Polygon.originY[eid] = 0;
  Polygon.verticesX[eid] = groundBox.x;
  Polygon.verticesY[eid] = groundBox.y;

  // Set physics values for ground
  RigidBody.mass[eid] = 0; // Infinite mass
  RigidBody.friction[eid] = 0.5;
  RigidBody.restitution[eid] = 0.2;
  RigidBody.isStatic[eid] = 1;

  // Set collision values for ground
  Collidable.isActive[eid] = 1;
  Collidable.isTrigger[eid] = 0;
  Collidable.layer[eid] = CollisionMask.Wall;
  Collidable.mask[eid] = CollisionMask.Player | CollisionMask.NPC;

  // Set name
  Named.name[eid] = "Ground";
  createDebug(world, eid);
  SaveableMapEntity.eid[eid] = eid;

  return eid;
}
