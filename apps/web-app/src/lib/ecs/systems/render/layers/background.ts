import type { RenderContext, RenderLayer } from "../types";
import { RENDER_LAYERS } from "../types";

const CELL_SIZE = 100;
const GRID_ALPHA = 0.1;

export class BackgroundLayer implements RenderLayer {
  name = "background";
  order = RENDER_LAYERS.BACKGROUND;
  ignoreCamera = true;

  render({ world }: RenderContext): void {
    const context = world.canvas?.context;
    const canvas = world.canvas?.element;

    if (!context || !canvas) return;

    // Fill background with black
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Set grid style
    context.strokeStyle = `rgba(255, 255, 255, ${GRID_ALPHA})`;
    context.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x <= canvas.width; x += CELL_SIZE) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= canvas.height; y += CELL_SIZE) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }
  }
}
