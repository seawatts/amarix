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

      // Render layer
      layer.render(context);

      // Restore context state
      ctx.restore();
    }
  }
}
