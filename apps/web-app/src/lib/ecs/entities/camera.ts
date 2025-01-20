import { addComponent, addEntity } from "bitecs";

import type { World } from "../types";
import { Camera, Debug, Named, Transform } from "../components";

interface CreateCameraOptionsWithTarget {
  x?: never;
  y?: never;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  zoom?: number;
  target: number;
}

interface CreateCameraOptionsWithTransform {
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  zoom?: number;
  target?: never;
}

type CreateCameraOptions =
  | CreateCameraOptionsWithTarget
  | CreateCameraOptionsWithTransform;

export function createCamera(world: World, options?: CreateCameraOptions) {
  const eid = addEntity(world);

  // Add camera components
  addComponent(world, eid, Camera, Transform, Named, Debug);

  // Set camera values
  Camera.isActive[eid] = 1;
  Camera.isPanning[eid] = 0;
  Camera.lastPanX[eid] = 0;
  Camera.lastPanY[eid] = 0;
  Camera.maxX[eid] = Number.POSITIVE_INFINITY;
  Camera.maxY[eid] = Number.POSITIVE_INFINITY;
  Camera.minX[eid] = Number.NEGATIVE_INFINITY;
  Camera.minY[eid] = Number.NEGATIVE_INFINITY;
  Camera.smoothing[eid] = 0;
  Camera.target[eid] = options?.target ?? 0;
  Camera.zoom[eid] = options?.zoom ?? 1;

  // Set transform values
  Transform.x[eid] = options?.x ?? 0;
  Transform.y[eid] = options?.y ?? 0;
  Transform.rotation[eid] = options?.rotation ?? 0;
  Transform.scaleX[eid] = options?.scaleX ?? 1;
  Transform.scaleY[eid] = options?.scaleY ?? 1;

  // Set name
  Named.name[eid] = "Camera";

  return eid;
}
