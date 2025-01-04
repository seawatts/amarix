import type { World } from "bitecs";

import type { RenderContext } from "./render/types";
import { BackgroundLayer } from "./render/layers/background";
import { EntityLayer } from "./render/layers/entities";
import { ParticleLayer } from "./render/layers/particles";
import { SpriteLayer } from "./render/layers/sprites";
import { Renderer } from "./render/renderer";

// Create and configure renderer
const renderer = new Renderer();

// Add render layers in desired order
renderer.addLayer(new BackgroundLayer());
renderer.addLayer(new ParticleLayer());
renderer.addLayer(new SpriteLayer());
renderer.addLayer(new EntityLayer());

// Create the render system
export function createRenderSystem(
  canvas: HTMLCanvasElement,
  context_: CanvasRenderingContext2D,
) {
  // Track time for animations
  let lastTime = performance.now();

  return function renderSystem(world: World): World {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Create render context
    const context: RenderContext = {
      canvas,
      ctx: context_,
      deltaTime,
      world,
    };

    // Render all layers
    renderer.render(context);

    return world;
  };
}
