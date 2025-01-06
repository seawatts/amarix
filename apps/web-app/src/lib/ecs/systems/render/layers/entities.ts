import { query } from "bitecs";

import type { RenderContext, RenderLayer } from "../types";
import {
  Clickable,
  CurrentPlayer,
  Health,
  HostileNPC,
  Hoverable,
  NPC,
  Player,
  Polygon,
  Position,
} from "../../../components";
// import { PIXELS_PER_METER } from "../../physics";
import { RENDER_LAYERS } from "../types";

const PIXELS_PER_METER = 1;
const HEALTH_BAR_HEIGHT = 8;
const HEALTH_BAR_OFFSET = 10;

function getPolygonBounds(eid: number): { width: number; height: number } {
  const vertCount = Polygon.vertexCount[eid] ?? 0;
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < vertCount; index++) {
    const x = (Polygon.verticesX[eid]?.[index] ?? 0) * PIXELS_PER_METER;
    const y = (Polygon.verticesY[eid]?.[index] ?? 0) * PIXELS_PER_METER;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  return {
    height: maxY - minY,
    width: maxX - minX,
  };
}

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

function renderPolygon(
  context: CanvasRenderingContext2D,
  eid: number,
  fillStyle: string,
  strokeStyle: string,
  lineWidth: number,
  shadowColor?: string,
  shadowBlur?: number,
): void {
  const x = (Position.x[eid] ?? 0) * PIXELS_PER_METER;
  const y = (Position.y[eid] ?? 0) * PIXELS_PER_METER;
  const rotation = Polygon.rotation[eid] ?? 0;
  const vertCount = Polygon.vertexCount[eid] ?? 0;

  if (vertCount < 3) return;

  context.save();
  context.translate(x, y);
  context.rotate(rotation);

  // Apply styles
  context.fillStyle = fillStyle;
  if (shadowColor) context.shadowColor = shadowColor;
  if (shadowBlur) context.shadowBlur = shadowBlur;
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;

  // Draw polygon vertices in local space
  context.beginPath();
  for (let index = 0; index < vertCount; index++) {
    const vx = (Polygon.verticesX[eid]?.[index] ?? 0) * PIXELS_PER_METER;
    const vy = (Polygon.verticesY[eid]?.[index] ?? 0) * PIXELS_PER_METER;
    if (index === 0) {
      context.moveTo(vx, vy);
    } else {
      context.lineTo(vx, vy);
    }
  }
  context.closePath();
  context.fill();
  context.stroke();

  context.restore();
}

export class EntityLayer implements RenderLayer {
  name = "entities";
  order = RENDER_LAYERS.ENTITIES;

  render({ ctx, world }: RenderContext): void {
    const npcs = query(world, [Position, NPC, Polygon]);
    const hostileNpcs = query(world, [Position, HostileNPC]);
    const players = query(world, [Position, Player, CurrentPlayer, Polygon]);

    // Sort entities by y position for proper layering
    const renderOrder = [...npcs, ...players].sort((a, b) => {
      const yA = (Position.y[a] ?? 0) * PIXELS_PER_METER;
      const yB = (Position.y[b] ?? 0) * PIXELS_PER_METER;
      return yA - yB;
    });

    for (const eid of renderOrder) {
      const x = (Position.x[eid] ?? 0) * PIXELS_PER_METER;
      const y = (Position.y[eid] ?? 0) * PIXELS_PER_METER;
      const { width, height } = getPolygonBounds(eid);

      if (npcs.includes(eid)) {
        const isHostile = hostileNpcs.includes(eid);
        const isHovered = Hoverable.isHovered[eid] === 1;
        const isClicked = Clickable.isClicked[eid] === 1;

        // Render NPC polygon
        renderPolygon(
          ctx,
          eid,
          isHostile ? "#ff4d4d" : "#4d94ff",
          isHovered || isClicked ? "#ffffff" : "#ffffff66",
          isHovered || isClicked ? 3 : 2,
          isHostile ? "#ff000066" : "#0066ff66",
          isHovered ? 25 : 15,
        );

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
        // Render player polygon
        renderPolygon(ctx, eid, "#00ff88", "#ffffff66", 2, "#00ff8866", 20);

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
