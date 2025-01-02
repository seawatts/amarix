import type { World } from "bitecs";
import { query } from "bitecs";

import { BoundingBox, Collidable, Physics, Position } from "../components";

// Helper function to check if two rectangles overlap
function checkCollision(
  x1: number,
  y1: number,
  width1: number,
  height1: number,
  x2: number,
  y2: number,
  width2: number,
  height2: number,
): boolean {
  const left1 = x1 - width1 / 2;
  const right1 = x1 + width1 / 2;
  const top1 = y1 - height1 / 2;
  const bottom1 = y1 + height1 / 2;

  const left2 = x2 - width2 / 2;
  const right2 = x2 + width2 / 2;
  const top2 = y2 - height2 / 2;
  const bottom2 = y2 + height2 / 2;

  return left1 < right2 && right1 > left2 && top1 < bottom2 && bottom1 > top2;
}

// Helper function to handle collision response based on type
function handleCollision(
  entity1: number,
  entity2: number,
  dx: number,
  dy: number,
  minDistance: number,
) {
  const type1 = Collidable.type[entity1] ?? "";
  const type2 = Collidable.type[entity2] ?? "";
  const isStatic1 = Collidable.isStatic[entity1] === 1;
  const isStatic2 = Collidable.isStatic[entity2] === 1;

  // If both objects are static or either is a trigger, no collision response needed
  if (isStatic1 && isStatic2) return;
  if (type1 === "trigger" || type2 === "trigger") return;

  const angle = Math.atan2(dy, dx);
  const overlap = minDistance - Math.hypot(dx, dy);
  const pushX = Math.cos(angle) * overlap;
  const pushY = Math.sin(angle) * overlap;

  // Handle bounce collisions
  if (type1 === "bounce" || type2 === "bounce") {
    if (Physics.velocityX[entity1] !== undefined) {
      const elasticity = Physics.elasticity[entity1] ?? 0.5;
      const vx = Physics.velocityX[entity1] ?? 0;
      const vy = Physics.velocityY[entity1] ?? 0;
      Physics.velocityX[entity1] = -vx * elasticity;
      Physics.velocityY[entity1] = -vy * elasticity;
    }

    if (Physics.velocityX[entity2] !== undefined) {
      const elasticity = Physics.elasticity[entity2] ?? 0.5;
      const vx = Physics.velocityX[entity2] ?? 0;
      const vy = Physics.velocityY[entity2] ?? 0;
      Physics.velocityX[entity2] = -vx * elasticity;
      Physics.velocityY[entity2] = -vy * elasticity;
    }
    return;
  }

  // Handle solid collisions by adjusting velocities
  if (!isStatic1 && Physics.velocityX[entity1] !== undefined) {
    const mass1 = Physics.mass[entity1] ?? 1;
    if (isStatic2) {
      // Full velocity change for entity1
      Physics.velocityX[entity1] = pushX;
      Physics.velocityY[entity1] = pushY;
    } else {
      // Split velocity change based on mass
      const mass2 = Physics.mass[entity2] ?? 1;
      const totalMass = mass1 + mass2;
      const ratio1 = mass2 / totalMass;
      Physics.velocityX[entity1] = pushX * ratio1;
      Physics.velocityY[entity1] = pushY * ratio1;
    }
  }

  if (!isStatic2 && Physics.velocityX[entity2] !== undefined) {
    const mass2 = Physics.mass[entity2] ?? 1;
    if (isStatic1) {
      // Full velocity change for entity2
      Physics.velocityX[entity2] = -pushX;
      Physics.velocityY[entity2] = -pushY;
    } else {
      // Split velocity change based on mass
      const mass1 = Physics.mass[entity1] ?? 1;
      const totalMass = mass1 + mass2;
      const ratio2 = mass1 / totalMass;
      Physics.velocityX[entity2] = -pushX * ratio2;
      Physics.velocityY[entity2] = -pushY * ratio2;
    }
  }
}

// Helper function to check if two layers should collide
function shouldLayersCollide(layer1: number, layer2: number): boolean {
  // Layer collision matrix
  const collisionMatrix: Record<number, number[]> = {
    1: [2, 3], // Player collides with NPCs and walls
    2: [1, 2, 3], // NPCs collide with player, other NPCs, and walls
    3: [1, 2], // Walls collide with player and NPCs
  };

  return collisionMatrix[layer1]?.includes(layer2) ?? false;
}

export function createCollisionSystem() {
  return function collisionSystem(world: World) {
    // Query for entities with Position, BoundingBox, and Collidable components
    const entities = query(world, [Position, BoundingBox, Collidable]);

    // Check collisions between all pairs of entities
    for (let index = 0; index < entities.length; index++) {
      const entity1 = entities[index];
      const x1 = Position.x[entity1] ?? 0;
      const y1 = Position.y[entity1] ?? 0;
      const width1 = BoundingBox.width[entity1] ?? 0;
      const height1 = BoundingBox.height[entity1] ?? 0;
      const layer1 = Collidable.layer[entity1] ?? 0;

      for (let index_ = index + 1; index_ < entities.length; index_++) {
        const entity2 = entities[index_];
        const layer2 = Collidable.layer[entity2] ?? 0;

        // Skip if layers shouldn't collide
        if (!shouldLayersCollide(layer1, layer2)) continue;

        const x2 = Position.x[entity2] ?? 0;
        const y2 = Position.y[entity2] ?? 0;
        const width2 = BoundingBox.width[entity2] ?? 0;
        const height2 = BoundingBox.height[entity2] ?? 0;

        if (checkCollision(x1, y1, width1, height1, x2, y2, width2, height2)) {
          const dx = x1 - x2;
          const dy = y1 - y2;
          const minDistance = (width1 + width2) / 2;

          handleCollision(entity1, entity2, dx, dy, minDistance);
        }
      }
    }

    return world;
  };
}
