import { IsA, query } from "bitecs";

import type { RenderContext, RenderLayer } from "../types";
import { Debug, Polygon, Transform } from "../../../components";
import { RENDER_LAYERS } from "../types";

interface Point {
  x: number;
  y: number;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface DebugRenderStyles {
  lineWidth: number;
  strokeStyle: string;
  fillStyle: string;
}

function getLocalVertices(eid: number, scale = 1): Point[] {
  const vertCount = Polygon.vertexCount[eid] ?? 0;
  const vertices: Point[] = [];

  for (let index = 0; index < vertCount; index++) {
    const x = (Polygon.verticesX[eid]?.[index] ?? 0) * scale;
    const y = (Polygon.verticesY[eid]?.[index] ?? 0) * scale;
    vertices.push({ x, y });
  }

  return vertices;
}

function transformToWorldSpace(vertices: Point[], eid: number): Point[] {
  const x0 = Transform.x[eid] ?? 0;
  const y0 = Transform.y[eid] ?? 0;
  const rotation = Polygon.rotation[eid] ?? 0;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  return vertices.map((point) => ({
    x: x0 + (point.x * cos - point.y * sin),
    y: y0 + (point.x * sin + point.y * cos),
  }));
}

function transformToScreenSpace(
  vertices: Point[],
  camera: RenderContext["camera"],
  canvas: RenderContext["canvas"],
): Point[] {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  return vertices.map(({ x, y }) => ({
    x: x + centerX - camera.x,
    y: y + centerY - camera.y,
  }));
}

function getScreenVertices(
  eid: number,
  camera: RenderContext["camera"],
  canvas: RenderContext["canvas"],
): Point[] {
  const localVertices = getLocalVertices(eid, 1.1); // 10% larger for debug outline
  const worldVertices = transformToWorldSpace(localVertices, eid);
  return transformToScreenSpace(worldVertices, camera, canvas);
}

function drawCornerBoxes(
  context: CanvasRenderingContext2D,
  bounds: Bounds,
  styles: DebugRenderStyles,
) {
  const boxSize = 12;
  const padding = 4;
  const corners = [
    { x: bounds.minX - padding, y: bounds.minY - padding },
    { x: bounds.maxX + padding - boxSize, y: bounds.minY - padding },
    { x: bounds.minX - padding, y: bounds.maxY + padding - boxSize },
    { x: bounds.maxX + padding - boxSize, y: bounds.maxY + padding - boxSize },
  ];

  context.fillStyle = styles.strokeStyle;
  for (const corner of corners) {
    context.fillRect(corner.x, corner.y, boxSize, boxSize);
  }
}

function drawBoundingBox(
  context: CanvasRenderingContext2D,
  vertices: Point[],
  styles: DebugRenderStyles,
) {
  const bounds = getPolygonBounds(vertices);
  const padding = 4;

  context.lineWidth = styles.lineWidth;
  context.strokeStyle = styles.strokeStyle;
  context.strokeRect(
    bounds.minX - padding,
    bounds.minY - padding,
    bounds.maxX - bounds.minX + padding * 2,
    bounds.maxY - bounds.minY + padding * 2,
  );

  drawCornerBoxes(context, bounds, styles);
}

function drawDebugText(context: CanvasRenderingContext2D, bounds: Bounds) {
  const width = Math.round(bounds.maxX - bounds.minX);
  const height = Math.round(bounds.maxY - bounds.minY);
  const text = `${width} × ${height}`;

  // Set font first to get correct text measurements
  context.font = "20px GeistSans";

  // Draw pill background
  context.fillStyle = "#3b82f6"; // blue-500
  const horizontalPadding = 32;
  const textMetrics = context.measureText(text);
  const pillWidth = Math.max(textMetrics.width + horizontalPadding * 2, 140);
  const pillHeight = 48;
  const pillX = bounds.minX + (bounds.maxX - bounds.minX - pillWidth) / 2;
  const pillY = bounds.maxY + 32;
  const radius = pillHeight / 2;

  // Draw rounded rectangle
  context.beginPath();
  context.moveTo(pillX + radius, pillY);
  context.lineTo(pillX + pillWidth - radius, pillY);
  context.arc(
    pillX + pillWidth - radius,
    pillY + radius,
    radius,
    -Math.PI / 2,
    Math.PI / 2,
  );
  context.lineTo(pillX + radius, pillY + pillHeight);
  context.arc(
    pillX + radius,
    pillY + radius,
    radius,
    Math.PI / 2,
    -Math.PI / 2,
  );
  context.closePath();
  context.fill();

  // Draw text
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, pillX + pillWidth / 2, pillY + pillHeight / 2);
}

function getPolygonBounds(vertices: Point[]): Bounds {
  if (vertices.length === 0) {
    return { maxX: 0, maxY: 0, minX: 0, minY: 0 };
  }

  const bounds: Bounds = {
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
  };

  for (const point of vertices) {
    bounds.maxX = Math.max(bounds.maxX, point.x);
    bounds.maxY = Math.max(bounds.maxY, point.y);
    bounds.minX = Math.min(bounds.minX, point.x);
    bounds.minY = Math.min(bounds.minY, point.y);
  }

  return bounds;
}

export class DebugLayer implements RenderLayer {
  name = "debug";
  order = RENDER_LAYERS.DEBUG;
  ignoreCamera = true; // Draw in screen space

  render({ world, ctx, camera, canvas }: RenderContext): void {
    ctx.save();

    const entities = query(world, [Transform, IsA(world.prefabs.shape)]);

    for (const eid of entities) {
      const isHovered = Debug.hoveredEntity[eid] === 1;
      const shouldShowBoundingBox = Debug.showBoundingBox[eid] === 1;

      // Only render debug visuals if explicitly enabled by the debug system
      if (
        shouldShowBoundingBox &&
        isHovered &&
        Polygon.vertexCount[eid] !== undefined
      ) {
        const screenVertices = getScreenVertices(eid, camera, canvas);
        const bounds = getPolygonBounds(screenVertices);

        // Draw bounding box with corner boxes
        drawBoundingBox(ctx, screenVertices, {
          fillStyle: "",
          lineWidth: 6,
          strokeStyle: "#2563eb", // blue-600
        });

        // Draw debug text below
        drawDebugText(ctx, bounds);
      }
    }

    ctx.restore();
  }
}
