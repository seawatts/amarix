import type { createWorld } from "bitecs";
import { query } from "bitecs";

import { Movement, Player, Position } from "../components";

const CELL_SIZE = 100;
const MOVEMENT_SPEED = 8; // Pixels per frame

export const createMovementSystem = (canvas: HTMLCanvasElement) => {
  return (world: ReturnType<typeof createWorld>) => {
    const entities = query(world, [Position, Movement, Player]);

    for (const eid of entities) {
      const dx = Movement.dx[eid] ?? 0;
      const dy = Movement.dy[eid] ?? 0;

      if (dx === 0 && dy === 0) continue;

      // Normalize diagonal movement
      const length = Math.hypot(dx, dy);
      const normalizedDx = dx / length;
      const normalizedDy = dy / length;

      const newX = (Position.x[eid] ?? 0) + normalizedDx * MOVEMENT_SPEED;
      const newY = (Position.y[eid] ?? 0) + normalizedDy * MOVEMENT_SPEED;

      // Check canvas bounds with padding
      const padding = CELL_SIZE / 2;
      if (
        newX >= padding &&
        newX <= canvas.width - padding &&
        newY >= padding &&
        newY <= canvas.height - padding
      ) {
        Position.x[eid] = newX;
        Position.y[eid] = newY;
      }
    }

    return world;
  };
};
