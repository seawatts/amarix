import { query } from "bitecs";

import type { RenderContext, RenderLayer } from "../types";
import {
  BoundingBox,
  Clickable,
  CurrentPlayer,
  Health,
  HostileNPC,
  Hoverable,
  NPC,
  Player,
  Position,
} from "../../../components";
import { RENDER_LAYERS } from "../types";

const HEALTH_BAR_HEIGHT = 8;
const HEALTH_BAR_OFFSET = 10;

function renderHealthBar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  currentHealth: number,
  maxHealth: number,
): void {
  const healthPercentage = Math.max(0, Math.min(1, currentHealth / maxHealth));

  // Background
  context.fillStyle = "#4a0f0f";
  context.fillRect(
    x + 2,
    y - HEALTH_BAR_OFFSET - HEALTH_BAR_HEIGHT,
    width - 4,
    HEALTH_BAR_HEIGHT,
  );

  // Health
  context.fillStyle = "#00ff66";
  context.fillRect(
    x + 2,
    y - HEALTH_BAR_OFFSET - HEALTH_BAR_HEIGHT,
    (width - 4) * healthPercentage,
    HEALTH_BAR_HEIGHT,
  );

  // Border
  context.strokeStyle = "#ffffff33";
  context.strokeRect(
    x + 2,
    y - HEALTH_BAR_OFFSET - HEALTH_BAR_HEIGHT,
    width - 4,
    HEALTH_BAR_HEIGHT,
  );
}

export class EntityLayer implements RenderLayer {
  name = "entities";
  order = RENDER_LAYERS.ENTITIES;

  render({ ctx, world }: RenderContext): void {
    const npcs = query(world, [Position, NPC, BoundingBox]);
    const hostileNpcs = query(world, [Position, HostileNPC]);
    const players = query(world, [
      Position,
      Player,
      CurrentPlayer,
      BoundingBox,
    ]);

    // Sort entities by y position for proper layering
    const renderOrder = [...npcs, ...players].sort((a, b) => {
      const yA = Position.y[a] ?? 0;
      const yB = Position.y[b] ?? 0;
      return yA - yB;
    });

    for (const eid of renderOrder) {
      const x = Position.x[eid] ?? 0;
      const y = Position.y[eid] ?? 0;
      const width = BoundingBox.width[eid] ?? 0;
      const height = BoundingBox.height[eid] ?? 0;

      if (npcs.includes(eid)) {
        const isHostile = hostileNpcs.includes(eid);
        const isHovered = Hoverable.isHovered[eid] === 1;
        const isClicked = Clickable.isClicked[eid] === 1;

        // Set NPC style
        ctx.fillStyle = isHostile ? "#ff4d4d" : "#4d94ff";
        ctx.shadowColor = isHostile ? "#ff000066" : "#0066ff66";
        ctx.shadowBlur = isHovered ? 25 : 15;

        // Draw NPC
        ctx.fillRect(x - width / 2, y - height / 2, width, height);

        // Reset shadow
        ctx.shadowBlur = 0;

        // Border
        ctx.strokeStyle = isHovered || isClicked ? "#ffffff" : "#ffffff66";
        ctx.lineWidth = isHovered || isClicked ? 3 : 2;
        ctx.strokeRect(x - width / 2, y - height / 2, width, height);

        // Health bar
        const health = Health.current[eid] ?? 0;
        const maxHealth = Health.max[eid] ?? 0;
        renderHealthBar(
          ctx,
          x - width / 2,
          y - height / 2,
          width,
          health,
          maxHealth,
        );

        // Show cursor pointer when hovering
        if (isHovered) {
          ctx.canvas.style.cursor = "pointer";
        }
      }

      if (players.includes(eid)) {
        // Draw player
        ctx.fillStyle = "#00ff88";
        ctx.shadowColor = "#00ff8866";
        ctx.shadowBlur = 20;

        ctx.fillRect(x - width / 2, y - height / 2, width, height);

        // Reset shadow
        ctx.shadowBlur = 0;

        // Border
        ctx.strokeStyle = "#ffffff66";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - width / 2, y - height / 2, width, height);

        // Health bar
        const health = Health.current[eid] ?? 0;
        const maxHealth = Health.max[eid] ?? 0;
        renderHealthBar(
          ctx,
          x - width / 2,
          y - height / 2,
          width,
          health,
          maxHealth,
        );
      }
    }
  }
}
