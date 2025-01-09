import type { World } from "bitecs";
import { query } from "bitecs";

import type { RenderContext, RenderLayer } from "../types";
import {
  BoundingBox,
  CollisionManifold,
  Debug,
  Polygon,
  Transform,
  Velocity,
} from "../../../components";
import { PIXELS_PER_METER } from "../../../systems/physics";
import { RENDER_LAYERS } from "../types";

/**
 * Transforms local-space polygon vertices to world-space
 */
function getWorldVertices(eid: number): number[][] {
  const x0 = (Transform.x[eid] ?? 0) * PIXELS_PER_METER;
  const y0 = (Transform.y[eid] ?? 0) * PIXELS_PER_METER;
  const rotation = Polygon.rotation[eid] ?? 0;
  const vertCount = Polygon.vertexCount[eid] ?? 0;
  const result: number[][] = [];

  // Get local vertices and convert to pixels
  const vertices: [number, number][] = [];
  for (let index = 0; index < vertCount; index++) {
    const x = (Polygon.verticesX[eid]?.[index] ?? 0) * PIXELS_PER_METER;
    const y = (Polygon.verticesY[eid]?.[index] ?? 0) * PIXELS_PER_METER;
    vertices.push([x, y]);
  }

  // Transform to world space
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  for (const [vx, vy] of vertices) {
    // Apply rotation then translation (no need to scale again)
    const rotX = vx * cos - vy * sin;
    const rotY = vx * sin + vy * cos;
    result.push([x0 + rotX, y0 + rotY]);
  }

  return result;
}

/**
 * Basic point-in-polygon test using ray-casting
 */
function pointInPolygon(px: number, py: number, polygon: number[][]): boolean {
  let inside = false;
  for (
    let index = 0, index_ = polygon.length - 1;
    index < polygon.length;
    index_ = index++
  ) {
    const xi = polygon[index]?.[0] ?? 0;
    const yi = polygon[index]?.[1] ?? 0;
    const xj = polygon[index_]?.[0] ?? 0;
    const yj = polygon[index_]?.[1] ?? 0;

    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export class DebugLayer implements RenderLayer {
  name = "debug";
  order = RENDER_LAYERS.DEBUG;
  private hoveredEntity: number | null = null;

  updateHoveredEntity(mouseX: number, mouseY: number, world: World): void {
    const entities = query(world, [Transform, Polygon]);
    this.hoveredEntity = null;

    for (const eid of entities) {
      const polygon = getWorldVertices(eid);
      if (pointInPolygon(mouseX, mouseY, polygon)) {
        this.hoveredEntity = eid;
        break;
      }
    }
  }

  render({ ctx: context, world }: RenderContext): void {
    context.save();
    context.lineWidth = 2;
    context.font = "14px monospace";
    context.textBaseline = "top";

    // Get debug entity to check visualization flags
    const debugEntities = query(world, [Debug]);
    const debugEid = debugEntities[0];
    const showBoundingBoxes = debugEid
      ? Debug.showBoundingBox[debugEid] === 1
      : false;

    // Draw collision shapes
    const entities = query(world, [Transform]);
    for (const eid of entities) {
      const x = (Transform.x[eid] ?? 0) * PIXELS_PER_METER;
      const y = (Transform.y[eid] ?? 0) * PIXELS_PER_METER;

      // Check if hovered
      const isHovered = this.hoveredEntity === eid;
      context.strokeStyle = isHovered ? "#ffff00" : "#ff0000";
      context.fillStyle = isHovered ? "#ffff0033" : "#ff000033";

      // Draw bounding box if enabled
      if (showBoundingBoxes && BoundingBox.width[eid] !== undefined) {
        const width = (BoundingBox.width[eid] ?? 0) * PIXELS_PER_METER;
        const height = (BoundingBox.height[eid] ?? 0) * PIXELS_PER_METER;
        context.strokeStyle = isHovered ? "#ffff00" : "#00ff00";
        context.strokeRect(x - width / 2, y - height / 2, width, height);
      }

      // Draw polygon if entity has one
      if (Polygon.vertexCount[eid] !== undefined) {
        const polygon = getWorldVertices(eid);
        if (polygon.length > 1) {
          context.beginPath();
          context.moveTo(polygon[0]?.[0] ?? 0, polygon[0]?.[1] ?? 0);
          for (let index = 1; index < polygon.length; index++) {
            context.lineTo(polygon[index]?.[0] ?? 0, polygon[index]?.[1] ?? 0);
          }
          context.closePath();
          context.fill();
          context.stroke();
        }
      }

      // Draw a small dot at the entity's position
      context.fillStyle = isHovered ? "#ffff00" : "#ff0000";
      context.beginPath();
      context.arc(x, y, 3, 0, Math.PI * 2);
      context.fill();

      // Build debug text with shadow for better visibility
      let debugText = `EID ${eid}`;
      const vx = Velocity.x[eid];
      const vy = Velocity.y[eid];
      if (vx !== undefined && vy !== undefined) {
        debugText += ` | v=(${vx.toFixed(2)}, ${vy.toFixed(2)})`;
      }

      // Draw collision manifolds
      const manifolds = query(world, [CollisionManifold]);
      for (const manifoldEid of manifolds) {
        if (
          CollisionManifold.entity1[manifoldEid] === eid ||
          CollisionManifold.entity2[manifoldEid] === eid
        ) {
          debugText += " | COLLIDING";

          // Draw collision normal
          const normalX = CollisionManifold.normalX[manifoldEid] ?? 0;
          const normalY = CollisionManifold.normalY[manifoldEid] ?? 0;
          const contactX =
            (CollisionManifold.contactPointX[manifoldEid] ?? 0) *
            PIXELS_PER_METER;
          const contactY =
            (CollisionManifold.contactPointY[manifoldEid] ?? 0) *
            PIXELS_PER_METER;
          const normalScale = 20 * PIXELS_PER_METER; // Scale for visualization

          context.strokeStyle = "#00ff00";
          context.beginPath();
          context.moveTo(contactX, contactY);
          context.lineTo(
            contactX + normalX * normalScale,
            contactY + normalY * normalScale,
          );
          context.stroke();

          // Draw contact point
          context.fillStyle = "#00ff00";
          context.beginPath();
          context.arc(contactX, contactY, 3, 0, Math.PI * 2);
          context.fill();
        }
      }

      // Draw debug text with shadow for better visibility
      context.fillStyle = "#000000";
      context.fillText(debugText, x + 8, y - 24);
    }

    context.restore();
  }
}
