import type { World } from "bitecs";
import { addComponent, addEntity, query } from "bitecs";

import {
  BoundingBox,
  Collidable,
  CollisionManifold,
  Position,
} from "../components";

// Helper function to check if two rectangles overlap and get collision info
function checkCollision(
  x1: number,
  y1: number,
  width1: number,
  height1: number,
  x2: number,
  y2: number,
  width2: number,
  height2: number,
) {
  // Calculate bounds
  const left1 = x1 - width1 / 2;
  const right1 = x1 + width1 / 2;
  const top1 = y1 - height1 / 2;
  const bottom1 = y1 + height1 / 2;

  const left2 = x2 - width2 / 2;
  const right2 = x2 + width2 / 2;
  const top2 = y2 - height2 / 2;
  const bottom2 = y2 + height2 / 2;

  // Check for overlap
  if (
    left1 >= right2 ||
    right1 <= left2 ||
    top1 >= bottom2 ||
    bottom1 <= top2
  ) {
    return null;
  }

  // Calculate collision normal and penetration depth
  const dx = x2 - x1;
  const dy = y2 - y1;
  const overlapX = (width1 + width2) / 2 - Math.abs(dx);
  const overlapY = (height1 + height2) / 2 - Math.abs(dy);

  // Use the smallest overlap to determine collision normal
  let normalX = 0;
  let normalY = 0;
  let penetrationDepth = 0;

  if (overlapX < overlapY) {
    normalX = dx > 0 ? 1 : -1;
    penetrationDepth = overlapX;
  } else {
    normalY = dy > 0 ? 1 : -1;
    penetrationDepth = overlapY;
  }

  // Calculate contact point (middle of overlap)
  const contactX = x1 + (normalX * penetrationDepth) / 2;
  const contactY = y1 + (normalY * penetrationDepth) / 2;

  return {
    contactX,
    contactY,
    normalX,
    normalY,
    penetrationDepth,
  };
}

// Check if two layers can collide using the layer masks
function canLayersCollide(
  layer1: number,
  mask1: number,
  layer2: number,
  mask2: number,
): boolean {
  return (mask1 & (1 << layer2)) !== 0 && (mask2 & (1 << layer1)) !== 0;
}

export function createCollisionSystem() {
  return function collisionSystem(world: World) {
    // Query for entities with Position, BoundingBox, and Collidable components
    const entities = query(world, [Position, BoundingBox, Collidable]);

    // Check collisions between all pairs of entities
    for (let index = 0; index < entities.length; index++) {
      const entity1 = entities[index];
      if (!entity1) continue;

      // Skip if collision checking is disabled
      if (Collidable.isActive[entity1] !== 1) continue;

      const x1 = Position.x[entity1] ?? 0;
      const y1 = Position.y[entity1] ?? 0;
      const width1 = BoundingBox.width[entity1] ?? 0;
      const height1 = BoundingBox.height[entity1] ?? 0;
      const layer1 = Collidable.layer[entity1] ?? 0;
      const mask1 = Collidable.mask[entity1] ?? 0xff_ff_ff_ff; // Default to colliding with everything

      for (let index_ = index + 1; index_ < entities.length; index_++) {
        const entity2 = entities[index_];
        if (!entity2) continue;

        // Skip if collision checking is disabled
        if (Collidable.isActive[entity2] !== 1) continue;

        const layer2 = Collidable.layer[entity2] ?? 0;
        const mask2 = Collidable.mask[entity2] ?? 0xff_ff_ff_ff;

        // Skip if layers can't collide
        if (!canLayersCollide(layer1, mask1, layer2, mask2)) continue;

        const x2 = Position.x[entity2] ?? 0;
        const y2 = Position.y[entity2] ?? 0;
        const width2 = BoundingBox.width[entity2] ?? 0;
        const height2 = BoundingBox.height[entity2] ?? 0;

        // Check for collision and get collision data
        const collision = checkCollision(
          x1,
          y1,
          width1,
          height1,
          x2,
          y2,
          width2,
          height2,
        );

        if (collision) {
          // Create collision manifold entity
          const manifoldEid = addEntity(world);
          addComponent(world, manifoldEid, CollisionManifold);

          // Store collision data
          CollisionManifold.entity1[manifoldEid] = entity1;
          CollisionManifold.entity2[manifoldEid] = entity2;
          CollisionManifold.normalX[manifoldEid] = collision.normalX;
          CollisionManifold.normalY[manifoldEid] = collision.normalY;
          CollisionManifold.penetrationDepth[manifoldEid] =
            collision.penetrationDepth;
          CollisionManifold.contactPointX[manifoldEid] = collision.contactX;
          CollisionManifold.contactPointY[manifoldEid] = collision.contactY;
        }
      }
    }

    return world;
  };
}
