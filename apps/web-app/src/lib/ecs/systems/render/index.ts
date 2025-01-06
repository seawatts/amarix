import type { World } from "bitecs";

import { BackgroundLayer } from "./layers/background";
import { DebugLayer } from "./layers/debug";
import { EntityLayer } from "./layers/entities";
import { ParticleLayer } from "./layers/particles";
import { SpriteLayer } from "./layers/sprites";
import { Renderer } from "./renderer";

// Create and configure renderer
const renderer = new Renderer();

// Add render layers in desired order
renderer.addLayer(new BackgroundLayer());
renderer.addLayer(new ParticleLayer());
renderer.addLayer(new SpriteLayer());
renderer.addLayer(new EntityLayer());
renderer.addLayer(new DebugLayer());

// Create the render system
export function createRenderSystem(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
) {
  // Track time for animations

  return function renderSystem(world: World, deltaTime: number): World {
    // Render all layers
    renderer.render({
      canvas,
      ctx: context,
      deltaTime,
      world,
    });

    return world;
  };
}
