import { query } from "bitecs";

import type { RenderContext, RenderLayer } from "../types";
import { Particle } from "../../../components";
import { RENDER_LAYERS } from "../types";

export class ParticleLayer implements RenderLayer {
  name = "particles";
  order = RENDER_LAYERS.PARTICLES;

  render({ world }: RenderContext): void {
    const context = world.canvas?.context;
    const canvas = world.canvas?.element;
    if (!context || !canvas) return;

    const particles = query(world, [Particle]);

    for (const eid of particles) {
      if (!(Particle.isActive[eid] ?? 0)) continue;

      const x = Particle.x[eid] ?? 0;
      const y = Particle.y[eid] ?? 0;
      const size = Particle.size[eid] ?? 1;
      const alpha = Particle.alpha[eid] ?? 1;
      const color = String(Particle.color[eid] ?? "#ffffff");

      // Draw particle
      context.globalAlpha = alpha;
      context.fillStyle = color;
      context.beginPath();
      context.arc(x, y, size / 2, 0, Math.PI * 2);
      context.fill();
    }
  }
}
