import type { World } from '../../types'

export interface RenderContext {
  world: World
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
  camera: {
    x: number
    y: number
    zoom: number
    rotation: number
  }
}

export interface RenderLayer {
  name: string
  order: number
  render: (context: RenderContext) => void
  // Whether this layer should ignore camera transform (e.g., UI elements)
  ignoreCamera?: boolean
}

export interface RenderSystem {
  addLayer: (layer: RenderLayer) => void
  removeLayer: (name: string) => void
  render: (context: RenderContext) => void
}

// Common rendering utilities
export interface Transform {
  x: number
  y: number
  rotation?: number
  scaleX?: number
  scaleY?: number
  opacity?: number
}

export interface Dimensions {
  width: number
  height: number
}

// Constants
export const RENDER_LAYERS = {
  BACKGROUND: 0,
  DEBUG: 100,
  ENTITIES: 10,
  PARTICLES: 20,
  SPRITES: 30,
  UI: 200, // New layer for UI elements that shouldn't be affected by camera
} as const
