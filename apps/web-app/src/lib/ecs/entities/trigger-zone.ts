import type { World } from "bitecs";
import { addComponent, addEntity } from "bitecs";

import {
  Collidable,
  CollisionMask,
  Named,
  Polygon,
  Position,
  TriggerZone,
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

interface CreateTriggerZoneOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "battle";
  actionId: number;
  isRepeatable?: boolean;
  cooldown?: number;
}

export function createTriggerZone(
  world: World,
  options: CreateTriggerZoneOptions,
) {
  const triggerEid = addEntity(world);
  addComponent(
    world,
    triggerEid,
    Position,
    Polygon,
    Collidable,
    TriggerZone,
    Named,
  );

  // Set up the trigger zone position
  Position.x[triggerEid] = options.x;
  Position.y[triggerEid] = options.y;

  // Set up the trigger zone polygon
  const triggerBox = createBoxPolygon(options.width, options.height);
  Polygon.isConvex[triggerEid] = 1;
  Polygon.rotation[triggerEid] = 0;
  Polygon.vertexCount[triggerEid] = 4;
  Polygon.originX[triggerEid] = 0;
  Polygon.originY[triggerEid] = 0;
  Polygon.verticesX[triggerEid] = triggerBox.x;
  Polygon.verticesY[triggerEid] = triggerBox.y;

  // Set up collision properties
  Collidable.isActive[triggerEid] = 1;
  Collidable.isTrigger[triggerEid] = 1;
  Collidable.layer[triggerEid] = 4; // Trigger layer
  Collidable.mask[triggerEid] = CollisionMask.Trigger;

  // Set up trigger zone properties
  TriggerZone.type[triggerEid] = options.type;
  TriggerZone.actionId[triggerEid] = options.actionId;
  TriggerZone.isRepeatable[triggerEid] = options.isRepeatable ? 1 : 0;
  TriggerZone.cooldown[triggerEid] = options.cooldown ?? 0;

  // Set name
  Named.name[triggerEid] = `${options.type} Trigger ${options.actionId}`;

  return triggerEid;
}
