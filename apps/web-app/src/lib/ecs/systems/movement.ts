import { query } from "bitecs";

import type { World } from "../types";
import {
  Force,
  KeyboardState,
  Player,
  RigidBody,
  Transform,
} from "../components";
import { getMovementInput } from "../utils/keyboard";

// Constants based on player size (100 pixels) and physics scale
const PIXELS_PER_METER = 100; // 1 meter = 100 pixels
const BASE_MOVEMENT_FORCE = 2000; // Base force in Newtons
const MOVEMENT_FORCE = BASE_MOVEMENT_FORCE * PIXELS_PER_METER; // Scale force by pixel ratio
const MAX_SPEED = 10 * PIXELS_PER_METER; // 10 meters per second
const DAMPING = 0.95; // Smoother damping for more natural movement

export const createMovementSystem = (_canvas: HTMLCanvasElement) => {
  return function movementSystem(world: World) {
    const entities = query(world, [
      Transform,
      Force,
      RigidBody,
      KeyboardState,
      Player,
    ]);

    for (const eid of entities) {
      // Get movement input using helper function
      const { dx, dy } = getMovementInput(eid);

      if (dx === 0 && dy === 0) {
        // Apply smoother damping when no input
        Force.x[eid] = (Force.x[eid] ?? 0) * DAMPING;
        Force.y[eid] = (Force.y[eid] ?? 0) * DAMPING;
        continue;
      }

      // Normalize diagonal movement
      const length = Math.hypot(dx, dy);
      const normalizedDx = dx / length;
      const normalizedDy = dy / length;

      // Apply force based on movement direction and mass
      const mass = RigidBody.mass[eid] ?? 1;
      const scaledForce = MOVEMENT_FORCE / PIXELS_PER_METER; // Convert to world units
      Force.x[eid] = normalizedDx * scaledForce * mass;
      Force.y[eid] = normalizedDy * scaledForce * mass;

      // Clamp force to prevent excessive speed
      const currentForce = Math.hypot(Force.x[eid] ?? 0, Force.y[eid] ?? 0);
      if (currentForce > MAX_SPEED) {
        const scale = MAX_SPEED / currentForce;
        Force.x[eid] = (Force.x[eid] ?? 0) * scale;
        Force.y[eid] = (Force.y[eid] ?? 0) * scale;
      }
    }
  };
};
