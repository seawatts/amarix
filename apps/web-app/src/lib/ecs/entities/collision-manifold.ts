import { addComponent, addEntity } from "bitecs";

import type { World } from "../types";
import { CollisionManifold, Named, Transform } from "../components";

export function createCollisionManifold(world: World) {
  const collisionManifoldEid = addEntity(world);
  addComponent(
    world,
    collisionManifoldEid,
    CollisionManifold,
    Transform,
    Named,
  );

  // Position the ground
  Transform.x[collisionManifoldEid] = 0;
  Transform.y[collisionManifoldEid] = 0;
  Transform.rotation[collisionManifoldEid] = 0;
  Transform.scaleX[collisionManifoldEid] = 1;
  Transform.scaleY[collisionManifoldEid] = 1;

  // Set name
  Named.name[collisionManifoldEid] = "Collision Manifold";

  return collisionManifoldEid;
}
