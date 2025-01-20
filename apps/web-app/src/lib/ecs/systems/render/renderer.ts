import type { RenderContext, RenderLayer, RenderSystem } from "./types";
import { PIXELS_PER_METER } from "../physics";

export class Renderer implements RenderSystem {
  private layers: Map<string, RenderLayer>;

  constructor() {
    this.layers = new Map();
  }

  addLayer(layer: RenderLayer): void {
    this.layers.set(layer.name, layer);
  }

  removeLayer(name: string): void {
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    this.layers.delete(name);
  }

  private applyCameraTransform(context: RenderContext): void {
    const canvas = context.world.canvas;
    const camera = context.camera;

    if (!canvas) {
      return;
    }

    // 1. Move to the center of the viewport
    canvas.context.translate(
      canvas.element.width / 2,
      canvas.element.height / 2,
    );

    // 2. Apply zoom and PIXELS_PER_METER scaling
    const scale = camera.zoom / PIXELS_PER_METER;
    canvas.context.scale(scale, scale);

    // 3. Apply rotation
    canvas.context.rotate(camera.rotation);

    // 4. Move world opposite to camera position
    canvas.context.translate(
      -camera.x * PIXELS_PER_METER,
      -camera.y * PIXELS_PER_METER,
    );
  }

  render(context: RenderContext): void {
    const canvas = context.world.canvas;

    // Clear the canvas
    if (!canvas) {
      return;
    }
    canvas.context.clearRect(0, 0, canvas.element.width, canvas.element.height);

    // Sort layers by order and render
    const sortedLayers = [...this.layers.values()].sort(
      (a, b) => a.order - b.order,
    );

    for (const layer of sortedLayers) {
      // Save context state before any transformations
      canvas.context.save();

      try {
        // Apply camera transform unless the layer should ignore it
        if (!layer.ignoreCamera) {
          this.applyCameraTransform(context);
        }

        // Render layer
        layer.render(context);
      } finally {
        // Always restore context state, even if rendering fails
        canvas.context.restore();
      }
    }
  }
}
