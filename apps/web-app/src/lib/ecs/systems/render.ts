import type { createWorld } from "bitecs";
import { query } from "bitecs";

import { Player, Position } from "../components";

const CELL_SIZE = 50;
const GRID_COLOR = "#e5e7eb";
const PLAYER_COLOR = "#3b82f6";
const PLAYER_RADIUS = 20;

export const createRenderSystem = (
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
) => {
  return (world: ReturnType<typeof createWorld>) => {
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    const drawGrid = () => {
      context.strokeStyle = GRID_COLOR;
      context.lineWidth = 1;

      const numberCols = Math.ceil(canvas.width / CELL_SIZE);
      const numberRows = Math.ceil(canvas.height / CELL_SIZE);

      // Draw vertical lines
      for (let x = 0; x <= numberCols; x++) {
        context.beginPath();
        context.moveTo(x * CELL_SIZE, 0);
        context.lineTo(x * CELL_SIZE, canvas.height);
        context.stroke();
      }

      // Draw horizontal lines
      for (let y = 0; y <= numberRows; y++) {
        context.beginPath();
        context.moveTo(0, y * CELL_SIZE);
        context.lineTo(canvas.width, y * CELL_SIZE);
        context.stroke();
      }
    };

    // Draw grid
    drawGrid();

    // Draw entities
    const entities = query(world, [Position, Player]);
    for (const eid of entities) {
      const x = Position.x[eid] ?? 0;
      const y = Position.y[eid] ?? 0;

      // Draw player
      context.beginPath();
      context.arc(x, y, PLAYER_RADIUS, 0, Math.PI * 2);
      context.fillStyle = PLAYER_COLOR;
      context.fill();
      context.closePath();
    }

    return world;
  };
};
