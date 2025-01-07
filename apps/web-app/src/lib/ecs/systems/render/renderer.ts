import type { RenderContext, RenderLayer, RenderSystem } from "./types";

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
    const { ctx, canvas, camera } = context;

    // 1. Move to the center of the viewport
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // 2. Apply zoom and rotation
    ctx.scale(camera.zoom, camera.zoom);
    ctx.rotate(camera.rotation);

    // 3. Move the world so the camera/target position is at the center
    // We negate the camera position because we're moving the world opposite to the camera
    ctx.translate(-camera.x, -camera.y);
  }

  render(context: RenderContext): void {
    const { ctx, canvas } = context;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sort layers by order and render
    const sortedLayers = [...this.layers.values()].sort(
      (a, b) => a.order - b.order,
    );

    for (const layer of sortedLayers) {
      // Save context state
      ctx.save();

      // Apply camera transform unless the layer should ignore it
      if (!layer.ignoreCamera) {
        this.applyCameraTransform(context);
      }

      // Render layer
      layer.render(context);

      // Restore context state
      ctx.restore();
    }
  }
}
