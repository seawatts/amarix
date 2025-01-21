import { addComponent, addEntity } from "bitecs";

import type { World } from "../types";
import {
  BoundingBox,
  Collidable,
  CollisionMask,
  Named,
  Transform,
  TriggerZone,
} from "../components";
import { createDebug } from "./debug";

interface CreateTriggerZoneOptions {
  actionId: number;
  cooldown: number;
  height: number;
  isRepeatable: boolean;
  type: string;
  width: number;
  x: number;
  y: number;
}

export function createTriggerZone(
  world: World,
  options: CreateTriggerZoneOptions,
) {
  const eid = addEntity(world);

  // Add trigger zone components
  addComponent(
    world,
    eid,
    Transform,
    BoundingBox,
    Collidable,
    TriggerZone,
    Named,
  );

  // Set transform values
  Transform.x[eid] = options.x;
  Transform.y[eid] = options.y;
  Transform.rotation[eid] = 0;
  Transform.scaleX[eid] = 1;
  Transform.scaleY[eid] = 1;

  // Set bounding box values
  BoundingBox.width[eid] = options.width;
  BoundingBox.height[eid] = options.height;

  // Set collision values
  Collidable.isActive[eid] = 1;
  Collidable.isTrigger[eid] = 1;
  Collidable.layer[eid] = CollisionMask.Trigger;
  Collidable.mask[eid] = CollisionMask.Player;

  // Set trigger zone values
  TriggerZone.actionId[eid] = options.actionId;
  TriggerZone.cooldown[eid] = options.cooldown;
  TriggerZone.isActivated[eid] = 0;
  TriggerZone.isRepeatable[eid] = Number(options.isRepeatable);
  TriggerZone.lastActivatedTime[eid] = 0;
  TriggerZone.type[eid] = options.type;

  // Set name
  Named.name[eid] = `${options.type} Trigger`;
  createDebug(world, eid);

  return eid;
}
