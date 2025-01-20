import { query } from "bitecs";

import type { World } from "../../types";
import { Camera, Transform } from "../../components";
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
export function createRenderSystem() {
  return function renderSystem(world: World) {
    // Get camera information
    const cameras = query(world, [Camera]);
    const cameraInfo = {
      rotation: 0,
      x: 0,
      y: 0,
      zoom: 1,
    };

    // Get the first active camera
    for (const eid of cameras) {
      if (!Camera.isActive[eid]) continue;

      // Get target position if target exists
      const targetEntity = Camera.target[eid];
      if (targetEntity && Transform.x[targetEntity] !== undefined) {
        // Get target position
        cameraInfo.x = Transform.x[targetEntity] ?? 0;
        cameraInfo.y = Transform.y[targetEntity] ?? 0;
      } else {
        cameraInfo.x = Transform.x[eid] ?? 0;
        cameraInfo.y = Transform.y[eid] ?? 0;
      }

      cameraInfo.zoom = Camera.zoom[eid] ?? 1;
      cameraInfo.rotation = Transform.rotation[eid] ?? 0;
      break;
    }

    // Render all layers
    renderer.render({
      camera: cameraInfo,
      world,
    });
  };
}
