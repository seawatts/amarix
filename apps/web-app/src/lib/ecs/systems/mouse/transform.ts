import { Camera, Transform } from '../../components'

export function transformMouseToWorld(
  mouseX: number,
  mouseY: number,
  canvas: HTMLCanvasElement,
  cameraEid: number,
): { x: number; y: number } {
  // Get camera properties
  const cameraX = Transform.x[cameraEid] ?? 0
  const cameraY = Transform.y[cameraEid] ?? 0
  const cameraZoom = Camera.zoom[cameraEid] ?? 1
  const cameraRotation = Transform.rotation[cameraEid] ?? 0

  // Convert mouse position to be relative to canvas center
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const dx = mouseX - centerX
  const dy = mouseY - centerY

  // Apply inverse transformations in reverse order:
  // 1. Inverse of zoom and scale
  const scale = cameraZoom
  const x1 = dx / scale
  const y1 = dy / scale

  // 2. Inverse of rotation
  const cos = Math.cos(-cameraRotation)
  const sin = Math.sin(-cameraRotation)
  const x2 = x1 * cos - y1 * sin
  const y2 = x1 * sin + y1 * cos

  // 3. Add camera position and convert to world units
  const worldX = x2 + cameraX
  const worldY = y2 + cameraY

  // Round to 3 decimal places to avoid floating point issues
  return {
    x: Math.round(worldX * 1000) / 1000,
    y: Math.round(worldY * 1000) / 1000,
  }
}
