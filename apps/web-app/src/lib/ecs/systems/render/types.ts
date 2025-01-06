import type { World } from "bitecs";

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  world: World;
  deltaTime: number;
}

export interface RenderLayer {
  name: string;
  order: number;
  render: (context: RenderContext) => void;
}

export interface RenderSystem {
  addLayer: (layer: RenderLayer) => void;
  removeLayer: (name: string) => void;
  render: (context: RenderContext) => void;
}

// Common rendering utilities
export interface Transform {
  x: number;
  y: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

// Constants
export const RENDER_LAYERS = {
  BACKGROUND: 0,
  DEBUG: 100,
  ENTITIES: 10,
  PARTICLES: 20,
  SPRITES: 30,
} as const;
