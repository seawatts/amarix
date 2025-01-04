import type { World } from "bitecs";
import { query, removeEntity } from "bitecs";

import { CollisionManifold, Force, Physics, Position } from "../components";

const GRAVITY = 9.81; // m/s²

function resolveCollision(
  entity: number,
  normalX: number,
  normalY: number,
  penetrationDepth: number,
  isEntity1: boolean,
) {
  if (!Physics.isKinematic[entity] || Physics.isStatic[entity]) return;

  // Get physics properties
  const mass = Physics.mass[entity] ?? 1;
  const restitution = Physics.restitution[entity] ?? 0;
  const vx = Physics.velocityX[entity] ?? 0;
  const vy = Physics.velocityY[entity] ?? 0;

  // Calculate impulse (flip normal for entity2)
  const nx = isEntity1 ? normalX : -normalX;
  const ny = isEntity1 ? normalY : -normalY;
  const relativeVelX = vx * nx;
  const relativeVelY = vy * ny;
  const impulse = (-(1 + restitution) * (relativeVelX + relativeVelY)) / mass;

  // Apply impulse
  if (Physics.velocityX[entity] !== undefined) {
    Physics.velocityX[entity] += impulse * nx;
  }
  if (Physics.velocityY[entity] !== undefined) {
    Physics.velocityY[entity] += impulse * ny;
  }

  // Resolve penetration
  if (Position.x[entity] !== undefined) {
    Position.x[entity] += nx * penetrationDepth * 0.5;
  }
  if (Position.y[entity] !== undefined) {
    Position.y[entity] += ny * penetrationDepth * 0.5;
  }
}

export function createPhysicsSystem() {
  return function physicsSystem(world: World, deltaTime: number) {
    // Convert deltaTime to seconds
    const dt = deltaTime / 1000;

    // First, handle collisions from previous frame
    const collisions = query(world, [CollisionManifold]);
    for (const manifoldEid of collisions) {
      const entity1 = CollisionManifold.entity1[manifoldEid];
      const entity2 = CollisionManifold.entity2[manifoldEid];
      const normalX = CollisionManifold.normalX[manifoldEid];
      const normalY = CollisionManifold.normalY[manifoldEid];
      const penetrationDepth = CollisionManifold.penetrationDepth[manifoldEid];

      // Skip if any required data is missing
      if (
        entity1 === undefined ||
        entity2 === undefined ||
        normalX === undefined ||
        normalY === undefined ||
        penetrationDepth === undefined
      ) {
        removeEntity(world, manifoldEid);
        continue;
      }

      // Skip if either entity is not physics-enabled
      if (!Physics.isKinematic[entity1] && !Physics.isKinematic[entity2]) {
        removeEntity(world, manifoldEid);
        continue;
      }

      // Resolve collisions
      resolveCollision(entity1, normalX, normalY, penetrationDepth, true);
      resolveCollision(entity2, normalX, normalY, penetrationDepth, false);

      // Remove the collision manifold after processing
      removeEntity(world, manifoldEid);
    }

    // Then update physics for all entities
    const physicsEntities = query(world, [Position, Physics]);
    for (const eid of physicsEntities) {
      if (!Physics.isKinematic[eid]) continue;

      // Apply forces if entity has Force component
      const hasForce =
        Force.forceX[eid] !== undefined && Force.forceY[eid] !== undefined;
      if (hasForce && Physics.velocityY[eid] !== undefined) {
        const fx = Force.forceX[eid] ?? 0;
        const fy = Force.forceY[eid] ?? 0;
        const mass = Physics.mass[eid] ?? 1;

        // F = ma, so a = F/m
        Physics.velocityX[eid] += (fx / mass) * dt;
        Physics.velocityY[eid] += (fy / mass) * dt;
      }

      // Update velocities based on acceleration
      if (
        Physics.velocityX[eid] !== undefined &&
        Physics.velocityY[eid] !== undefined
      ) {
        const ax = Physics.accelerationX[eid] ?? 0;
        const ay = Physics.accelerationY[eid] ?? 0;
        Physics.velocityX[eid] += ax * dt;
        Physics.velocityY[eid] += ay * dt;

        // Apply friction
        const friction = Physics.friction[eid] ?? 0;
        if (friction > 0) {
          const frictionForce = friction * dt;
          const vx = Physics.velocityX[eid];
          const vy = Physics.velocityY[eid];
          const speed = Math.hypot(vx, vy);

          if (speed > 0) {
            const newSpeed = Math.max(0, speed - frictionForce);
            const scale = newSpeed / speed;
            Physics.velocityX[eid] *= scale;
            Physics.velocityY[eid] *= scale;
          }
        }

        // Update positions based on velocity
        if (Position.x[eid] !== undefined && Position.y[eid] !== undefined) {
          Position.x[eid] += Physics.velocityX[eid] * dt;
          Position.y[eid] += Physics.velocityY[eid] * dt;
        }

        // Reset acceleration (it needs to be re-applied each frame)
        if (
          Physics.accelerationX[eid] !== undefined &&
          Physics.accelerationY[eid] !== undefined
        ) {
          Physics.accelerationX[eid] = 0;
          Physics.accelerationY[eid] = 0;
        }
      }
    }

    return world;
  };
}
