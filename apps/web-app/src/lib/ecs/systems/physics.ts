import type { World } from "bitecs";
import { query } from "bitecs";

import { Physics, Position } from "../components";

const MIN_VELOCITY = 0.01;

export function createPhysicsSystem() {
  return function physicsSystem(world: World) {
    const entities = query(world, [Position, Physics]);

    for (const eid of entities) {
      // Get current values with safe defaults
      const velocityX = Physics.velocityX[eid] ?? 0;
      const velocityY = Physics.velocityY[eid] ?? 0;
      const accelerationX = Physics.accelerationX[eid] ?? 0;
      const accelerationY = Physics.accelerationY[eid] ?? 0;
      const friction = Physics.friction[eid] ?? 0.1;
      const x = Position.x[eid] ?? 0;
      const y = Position.y[eid] ?? 0;

      // Update velocity based on acceleration
      let newVelocityX = velocityX + accelerationX;
      let newVelocityY = velocityY + accelerationY;

      // Apply friction
      if (friction > 0) {
        const frictionFactor = 1 - friction;
        newVelocityX *= frictionFactor;
        newVelocityY *= frictionFactor;

        // Stop very small movements
        if (Math.abs(newVelocityX) < MIN_VELOCITY) newVelocityX = 0;
        if (Math.abs(newVelocityY) < MIN_VELOCITY) newVelocityY = 0;
      }

      // Update velocities
      Physics.velocityX[eid] = newVelocityX;
      Physics.velocityY[eid] = newVelocityY;

      // Update position based on velocity
      Position.x[eid] = x + newVelocityX;
      Position.y[eid] = y + newVelocityY;

      // Reset acceleration (it needs to be re-applied each frame)
      Physics.accelerationX[eid] = 0;
      Physics.accelerationY[eid] = 0;
    }

    return world;
  };
}
