export function isPointInBox(
  mouseX: number,
  mouseY: number,
  entityX: number,
  entityY: number,
  width: number,
  height: number,
  rotation: number,
): boolean {
  // Translate point to origin
  const dx = mouseX - entityX
  const dy = mouseY - entityY

  // Rotate point around origin (inverse rotation)
  const cos = Math.cos(-rotation)
  const sin = Math.sin(-rotation)
  const rx = dx * cos - dy * sin
  const ry = dx * sin + dy * cos

  // Check if point is in axis-aligned box
  return (
    rx >= -width / 2 && rx <= width / 2 && ry >= -height / 2 && ry <= height / 2
  )
}

export function isPointInCircle(
  mouseX: number,
  mouseY: number,
  entityX: number,
  entityY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): boolean {
  // Get distance from point to center
  const dx = mouseX - entityX
  const dy = mouseY - entityY
  const distance = Math.hypot(dx, dy)

  // Check if point is within radius
  if (distance > radius) return false

  // If we have a full circle, we're done
  if (endAngle - startAngle >= Math.PI * 2) return true

  // Otherwise, check if point is within arc
  const angle = Math.atan2(dy, dx)
  const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle
  return normalizedAngle >= startAngle && normalizedAngle <= endAngle
}

export function isPointInPolygon(
  mouseX: number,
  mouseY: number,
  entityX: number,
  entityY: number,
  points: { x: number; y: number }[],
  rotation = 0,
): boolean {
  if (points.length === 0) return false

  // Translate point to origin
  const dx = mouseX - entityX
  const dy = mouseY - entityY

  // Rotate point around origin (inverse rotation)
  const cos = Math.cos(-rotation)
  const sin = Math.sin(-rotation)
  const rx = dx * cos - dy * sin
  const ry = dx * sin + dy * cos

  // Ray casting algorithm
  let inside = false
  let index = points.length - 1

  for (let index_ = 0; index_ < points.length; index_++) {
    const currentPoint = points[index_]
    const previousPoint = points[index]

    if (!currentPoint || !previousPoint) continue

    const xi = currentPoint.x
    const yi = currentPoint.y
    const xj = previousPoint.x
    const yj = previousPoint.y

    const intersect =
      yi > ry !== yj > ry && rx < ((xj - xi) * (ry - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside

    index = index_
  }

  return inside
}
