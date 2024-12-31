import { addEntity, createWorld } from "bitecs";

import { Movement, Player, Position } from "./components";

const CELL_SIZE = 50;

export function createGameWorld() {
  return createWorld();
}

export function createPlayer(world: ReturnType<typeof createWorld>) {
  const eid = addEntity(world);

  // Initialize position at the center of the first cell
  Position.x[eid] = CELL_SIZE / 2;
  Position.y[eid] = CELL_SIZE / 2;

  // Initialize movement
  Movement.dx[eid] = 0;
  Movement.dy[eid] = 0;

  // Add player tag
  Player[eid] = true;

  return eid;
}
