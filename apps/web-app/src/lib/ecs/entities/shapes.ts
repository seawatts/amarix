import type { World } from "bitecs";
import { addComponent, addEntity } from "bitecs";

import {
  Box,
  Circle,
  Collidable,
  CollisionMask,
  Debug,
  Named,
  RigidBody,
  Shape,
  Style,
  Transform,
} from "../components";

interface CreateShapeOptions {
  isStatic?: boolean;
  isTrigger?: boolean;
  layer?: number;
  mask?: number;
  name?: string;
  x: number;
  y: number;
}

interface CreateBoxOptions extends CreateShapeOptions {
  height: number;
  isWireframe?: boolean;
  rotation?: number;
  width: number;
}

interface CreateCircleOptions extends CreateShapeOptions {
  endAngle?: number;
  isWireframe?: boolean;
  radius: number;
  segments?: number;
  startAngle?: number;
}

interface CreateStyleOptions {
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
}

export function createBox(world: World, options: CreateBoxOptions) {
  const eid = addEntity(world);

  // Add components
  addComponent(
    world,
    eid,
    Transform,
    Box,
    Shape,
    Style,
    RigidBody,
    Collidable,
    Named,
    Debug,
  );

  // Set transform values
  Transform.x[eid] = options.x;
  Transform.y[eid] = options.y;
  Transform.rotation[eid] = 0;
  Transform.scaleX[eid] = 1;
  Transform.scaleY[eid] = 1;

  // Set box values
  Box.width[eid] = options.width;
  Box.height[eid] = options.height;
  Box.rotation[eid] = options.rotation ?? 0;
  Box.isWireframe[eid] = Number(options.isWireframe ?? false);
  Box.originX[eid] = 0;
  Box.originY[eid] = 0;

  // Set shape type
  Shape.type[eid] = "box";

  // Set default style
  Style.fillColor[eid] = "#ffffff";
  Style.fillOpacity[eid] = 1;
  Style.strokeColor[eid] = "#000000";
  Style.strokeOpacity[eid] = 1;
  Style.strokeWidth[eid] = 1;

  // Set physics values
  RigidBody.mass[eid] = options.isStatic ? 0 : 1;
  RigidBody.friction[eid] = 0.2;
  RigidBody.restitution[eid] = 0.2;
  RigidBody.isStatic[eid] = Number(options.isStatic ?? false);

  // Set collision values
  Collidable.isActive[eid] = 1;
  Collidable.isTrigger[eid] = Number(options.isTrigger ?? false);
  Collidable.layer[eid] = options.layer ?? CollisionMask.Wall;
  Collidable.mask[eid] =
    options.mask ?? CollisionMask.Player | CollisionMask.NPC;

  // Set name
  Named.name[eid] = options.name ?? "Box";

  return eid;
}

export function createCircle(world: World, options: CreateCircleOptions) {
  const eid = addEntity(world);

  // Add components
  addComponent(
    world,
    eid,
    Transform,
    Circle,
    Shape,
    Style,
    RigidBody,
    Collidable,
    Named,
    Debug,
  );

  // Set transform values
  Transform.x[eid] = options.x;
  Transform.y[eid] = options.y;
  Transform.rotation[eid] = 0;
  Transform.scaleX[eid] = 1;
  Transform.scaleY[eid] = 1;

  // Set circle values
  Circle.radius[eid] = options.radius;
  Circle.segments[eid] = options.segments ?? 32;
  Circle.startAngle[eid] = options.startAngle ?? 0;
  Circle.endAngle[eid] = options.endAngle ?? Math.PI * 2;
  Circle.isWireframe[eid] = Number(options.isWireframe ?? false);
  Circle.originX[eid] = 0;
  Circle.originY[eid] = 0;

  // Set shape type
  Shape.type[eid] = "circle";

  // Set default style
  Style.fillColor[eid] = "#ffffff";
  Style.fillOpacity[eid] = 1;
  Style.strokeColor[eid] = "#000000";
  Style.strokeOpacity[eid] = 1;
  Style.strokeWidth[eid] = 1;

  // Set physics values
  RigidBody.mass[eid] = options.isStatic ? 0 : 1;
  RigidBody.friction[eid] = 0.2;
  RigidBody.restitution[eid] = 0.2;
  RigidBody.isStatic[eid] = Number(options.isStatic ?? false);

  // Set collision values
  Collidable.isActive[eid] = 1;
  Collidable.isTrigger[eid] = Number(options.isTrigger ?? false);
  Collidable.layer[eid] = options.layer ?? CollisionMask.Wall;
  Collidable.mask[eid] =
    options.mask ?? CollisionMask.Player | CollisionMask.NPC;

  // Set name
  Named.name[eid] = options.name ?? "Circle";

  return eid;
}

export function setStyle(
  world: World,
  eid: number,
  options: CreateStyleOptions,
) {
  if (options.fillColor !== undefined) {
    Style.fillColor[eid] = options.fillColor;
  }
  if (options.fillOpacity !== undefined) {
    Style.fillOpacity[eid] = options.fillOpacity;
  }
  if (options.strokeColor !== undefined) {
    Style.strokeColor[eid] = options.strokeColor;
  }
  if (options.strokeOpacity !== undefined) {
    Style.strokeOpacity[eid] = options.strokeOpacity;
  }
  if (options.strokeWidth !== undefined) {
    Style.strokeWidth[eid] = options.strokeWidth;
  }
}
