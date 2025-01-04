import { query } from "bitecs";

import type { RenderContext, RenderLayer } from "../types";
import { Particle } from "../../../components";
import { RENDER_LAYERS } from "../types";

export class ParticleLayer implements RenderLayer {
  name = "particles";
  order = RENDER_LAYERS.PARTICLES;

  render({ ctx, world }: RenderContext): void {
    const particles = query(world, [Particle]);

    for (const eid of particles) {
      if (!(Particle.isActive[eid] ?? 0)) continue;

      const x = Particle.x[eid] ?? 0;
      const y = Particle.y[eid] ?? 0;
      const size = Particle.size[eid] ?? 1;
      const alpha = Particle.alpha[eid] ?? 1;
      const color = String(Particle.color[eid] ?? "#ffffff");

      // Draw particle
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
