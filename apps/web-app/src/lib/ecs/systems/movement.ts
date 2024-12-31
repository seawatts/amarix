import type { createWorld } from "bitecs";
import { query } from "bitecs";

import { Movement, Player, Position } from "../components";

const CELL_SIZE = 50;

export const createMovementSystem = (canvas: HTMLCanvasElement) => {
  return (world: ReturnType<typeof createWorld>) => {
    const entities = query(world, [Position, Movement, Player]);

    for (const eid of entities) {
      const dx = Movement.dx[eid] ?? 0;
      const dy = Movement.dy[eid] ?? 0;

      if (dx === 0 && dy === 0) continue;

      const newX = (Position.x[eid] ?? 0) + dx * CELL_SIZE;
      const newY = (Position.y[eid] ?? 0) + dy * CELL_SIZE;

      // Check canvas bounds
      if (
        newX >= CELL_SIZE / 2 &&
        newX <= canvas.width - CELL_SIZE / 2 &&
        newY >= CELL_SIZE / 2 &&
        newY <= canvas.height - CELL_SIZE / 2
      ) {
        Position.x[eid] = newX;
        Position.y[eid] = newY;
      }

      // Reset movement
      Movement.dx[eid] = 0;
      Movement.dy[eid] = 0;
    }

    return world;
  };
};
