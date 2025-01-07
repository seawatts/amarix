import type { RenderContext, RenderLayer } from "../types";
import { RENDER_LAYERS } from "../types";

const CELL_SIZE = 100;
const GRID_ALPHA = 0.1;

export class BackgroundLayer implements RenderLayer {
  name = "background";
  order = RENDER_LAYERS.BACKGROUND;
  ignoreCamera = true;

  render({ ctx, canvas }: RenderContext): void {
    // Fill background with black
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set grid style
    ctx.strokeStyle = `rgba(255, 255, 255, ${GRID_ALPHA})`;
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x <= canvas.width; x += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= canvas.height; y += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }
}
