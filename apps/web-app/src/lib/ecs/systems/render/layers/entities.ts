import { IsA, query } from 'bitecs'

import {
  Box,
  Circle,
  Clickable,
  Health,
  Hoverable,
  Polygon,
  Style,
  Transform,
} from '../../../components'
import { PIXELS_PER_METER } from '../../../systems/physics'
import type { RenderContext, RenderLayer } from '../types'
import { RENDER_LAYERS } from '../types'

const HEALTH_BAR_HEIGHT = 8
const HEALTH_BAR_OFFSET = 10

function _getPolygonBounds(eid: number): { width: number; height: number } {
  const vertCount = Polygon.vertexCount[eid] ?? 0
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (let index = 0; index < vertCount; index++) {
    const x = Polygon.verticesX[eid]?.[index] ?? 0
    const y = Polygon.verticesY[eid]?.[index] ?? 0
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }

  return {
    height: maxY - minY,
    width: maxX - minX,
  }
}

function _renderHealthBar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  currentHealth: number,
  maxHealth: number,
): void {
  const healthPercentage = Math.max(0, Math.min(1, currentHealth / maxHealth))

  // Background
  context.fillStyle = '#4a0f0f'
  context.fillRect(
    x + 2,
    y - HEALTH_BAR_OFFSET - HEALTH_BAR_HEIGHT,
    width - 4,
    HEALTH_BAR_HEIGHT,
  )

  // Health
  context.fillStyle = '#00ff66'
  context.fillRect(
    x + 2,
    y - HEALTH_BAR_OFFSET - HEALTH_BAR_HEIGHT,
    (width - 4) * healthPercentage,
    HEALTH_BAR_HEIGHT,
  )

  // Border
  context.strokeStyle = '#ffffff33'
  context.strokeRect(
    x + 2,
    y - HEALTH_BAR_OFFSET - HEALTH_BAR_HEIGHT,
    width - 4,
    HEALTH_BAR_HEIGHT,
  )
}

function renderPolygon(context: CanvasRenderingContext2D, eid: number): void {
  const x = (Transform.x[eid] ?? 0) * PIXELS_PER_METER
  const y = (Transform.y[eid] ?? 0) * PIXELS_PER_METER
  const rotation = Polygon.rotation[eid] ?? 0
  const vertCount = Polygon.vertexCount[eid] ?? 0

  if (vertCount < 3) return

  context.save()
  context.translate(x, y)
  context.rotate(rotation)

  // Apply styles from Style component
  context.fillStyle = Style.fillColor[eid] ?? '#666666'
  context.strokeStyle = Style.strokeColor[eid] ?? '#333333'
  context.lineWidth = Style.strokeWidth[eid] ?? 2
  context.globalAlpha = Style.fillOpacity[eid] ?? 1

  // Draw polygon vertices in local space
  context.beginPath()
  for (let index = 0; index < vertCount; index++) {
    const vx = (Polygon.verticesX[eid]?.[index] ?? 0) * PIXELS_PER_METER
    const vy = (Polygon.verticesY[eid]?.[index] ?? 0) * PIXELS_PER_METER
    if (index === 0) {
      context.moveTo(vx, vy)
    } else {
      context.lineTo(vx, vy)
    }
  }
  context.closePath()
  context.fill()
  context.stroke()

  context.restore()
}

function renderBox(context: CanvasRenderingContext2D, eid: number): void {
  const x = (Transform.x[eid] ?? 0) * PIXELS_PER_METER
  const y = (Transform.y[eid] ?? 0) * PIXELS_PER_METER
  const width = (Box.width[eid] ?? 0) * PIXELS_PER_METER
  const height = (Box.height[eid] ?? 0) * PIXELS_PER_METER
  const rotation = Box.rotation[eid] ?? 0
  const isWireframe = Box.isWireframe[eid] === 1
  const originX = (Box.originX[eid] ?? 0) * PIXELS_PER_METER
  const originY = (Box.originY[eid] ?? 0) * PIXELS_PER_METER

  // Apply styles with better defaults
  context.fillStyle = Style.fillColor[eid] ?? '#666666'
  context.strokeStyle = Style.strokeColor[eid] ?? '#333333'
  context.lineWidth = Style.strokeWidth[eid] ?? 2
  context.globalAlpha = Style.fillOpacity[eid] ?? 1

  context.save()
  context.translate(x, y)
  context.rotate(rotation)
  context.translate(-originX, -originY)

  if (!isWireframe) {
    context.fillRect(-width / 2, -height / 2, width, height)
  }
  context.strokeRect(-width / 2, -height / 2, width, height)

  context.restore()
  context.globalAlpha = 1
}

function renderCircle(context: CanvasRenderingContext2D, eid: number): void {
  const x = (Transform.x[eid] ?? 0) * PIXELS_PER_METER
  const y = (Transform.y[eid] ?? 0) * PIXELS_PER_METER
  const radius = (Circle.radius[eid] ?? 0) * PIXELS_PER_METER
  const startAngle = Circle.startAngle[eid] ?? 0
  const endAngle = Circle.endAngle[eid] ?? Math.PI * 2
  const isWireframe = Circle.isWireframe[eid] === 1
  const originX = (Circle.originX[eid] ?? 0) * PIXELS_PER_METER
  const originY = (Circle.originY[eid] ?? 0) * PIXELS_PER_METER

  // Apply styles with better defaults
  context.fillStyle = Style.fillColor[eid] ?? '#666666'
  context.strokeStyle = Style.strokeColor[eid] ?? '#333333'
  context.lineWidth = Style.strokeWidth[eid] ?? 2
  context.globalAlpha = Style.fillOpacity[eid] ?? 1

  context.save()
  context.translate(x, y)
  context.translate(-originX, -originY)

  context.beginPath()
  context.arc(0, 0, radius, startAngle, endAngle, false)

  if (!isWireframe) {
    context.fill()
  }
  context.stroke()

  context.restore()
  context.globalAlpha = 1
}

export class EntityLayer implements RenderLayer {
  name = 'entities'
  order = RENDER_LAYERS.ENTITIES

  render({ world, ctx, canvas }: RenderContext): void {
    const polygons = query(world, [
      Transform,
      Style,
      Polygon,
      IsA(world.prefabs.shape),
    ])
    const boxes = query(world, [
      Transform,
      Box,
      Style,
      IsA(world.prefabs.shape),
    ])
    const circles = query(world, [
      Transform,
      Circle,
      Style,
      IsA(world.prefabs.shape),
    ])

    // Sort all entities by y position for proper layering
    const renderOrder = [...polygons, ...boxes, ...circles].sort((a, b) => {
      const yA = Transform.y[a] ?? 0
      const yB = Transform.y[b] ?? 0
      return yA - yB
    })

    for (const eid of renderOrder) {
      // Render shapes first
      if (boxes.includes(eid)) {
        renderBox(ctx, eid)
        continue
      }

      if (circles.includes(eid)) {
        renderCircle(ctx, eid)
        continue
      }

      const _x = Transform.x[eid] ?? 0
      const _y = Transform.y[eid] ?? 0
      // const { width, height } = getPolygonBounds(eid)

      if (polygons.includes(eid)) {
        const isHovered = Hoverable.isHovered[eid] === 1
        const isClicked = Clickable.isClicked[eid] === 1

        // Store original style values
        const originalStrokeColor = Style.strokeColor[eid]
        const originalStrokeWidth = Style.strokeWidth[eid]

        // Temporarily update context styles for hover/click state
        if (isHovered || isClicked) {
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 3
        }

        renderPolygon(ctx, eid)

        // Restore original context styles
        if (isHovered || isClicked) {
          ctx.strokeStyle = originalStrokeColor ?? '#333333'
          ctx.lineWidth = originalStrokeWidth ?? 2
        }

        // Health bar
        const _health = Health.current[eid] ?? 0
        const _maxHealth = Health.max[eid] ?? 0
        // renderHealthBar(
        //   ctx,
        //   x - width / 2,
        //   y - height / 2,
        //   width,
        //   health,
        //   maxHealth,
        // );

        // Show cursor pointer when hovering
        if (isHovered) {
          canvas.style.cursor = 'pointer'
        }
      }

      // if (players.includes(eid)) {
      //   renderPolygon(ctx, eid);

      //   // Health bar
      //   const health = Health.current[eid] ?? 0;
      //   const maxHealth = Health.max[eid] ?? 0;
      //   renderHealthBar(
      //     ctx,
      //     x - width / 2,
      //     y - height / 2,
      //     width,
      //     health,
      //     maxHealth,
      //   );
      // }
    }
  }
}
