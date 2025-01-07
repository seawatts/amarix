import type { World } from "bitecs";
import { addComponent, addEntity } from "bitecs";

import { Camera, Debug, Named, Transform } from "../components";

interface CreateCameraOptions {
  target?: number;
}

export function createCamera(world: World, options: CreateCameraOptions = {}) {
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
  Camera.smoothing[eid] = 0.1;
  Camera.target[eid] = options.target ?? 0;
  Camera.zoom[eid] = 1;

  // Set transform values
  Transform.x[eid] = 0;
  Transform.y[eid] = 0;
  Transform.rotation[eid] = 0;
  Transform.scaleX[eid] = 1;
  Transform.scaleY[eid] = 1;

  // Set name
  Named.name[eid] = "Camera";

  return eid;
}
