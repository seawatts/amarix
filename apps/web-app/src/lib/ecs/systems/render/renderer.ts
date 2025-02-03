import { PIXELS_PER_METER } from '../physics'
import type { RenderContext, RenderLayer, RenderSystem } from './types'

export class Renderer implements RenderSystem {
  private layers: Map<string, RenderLayer>

  constructor() {
    this.layers = new Map()
  }

  addLayer(layer: RenderLayer): void {
    this.layers.set(layer.name, layer)
  }

  removeLayer(name: string): void {
    this.layers.delete(name)
  }

  private applyCameraTransform(context: RenderContext): void {
    const { canvas, camera, ctx } = context
    // 1. Move to the center of the viewport
    ctx.translate(canvas.width / 2, canvas.height / 2)

    // 2. Apply zoom and PIXELS_PER_METER scaling
    const scale = camera.zoom / PIXELS_PER_METER
    ctx.scale(scale, scale)

    // 3. Apply rotation
    ctx.rotate(camera.rotation)

    // 4. Move world opposite to camera position
    ctx.translate(-camera.x * PIXELS_PER_METER, -camera.y * PIXELS_PER_METER)
  }

  render(context: RenderContext): void {
    const { canvas, ctx } = context
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Sort layers by order and render
    // Sort layers by order and render
    const sortedLayers = [...this.layers.values()].sort(
      (a, b) => a.order - b.order,
    )

    for (const layer of sortedLayers) {
      // Save context state before any transformations
      ctx.save()

      try {
        // Apply camera transform unless the layer should ignore it
        if (!layer.ignoreCamera) {
          this.applyCameraTransform(context)
        }

        // Render layer
        layer.render(context)
      } finally {
        // Always restore context state, even if rendering fails
        ctx.restore()
      }
    }
  }
}
