import type { World as BitecsWorld, ComponentRef } from "bitecs";
import { z } from "zod";

export type Entity = number;
export type GameSystem = (world: World) => void;

export interface WorldProps {
  timing: {
    lastFrame: number;
    delta: number;
  };
  prefabs: {
    shape: Entity;
    [key: string]: Entity;
  };
  isPaused: boolean;
  components: ComponentRef[];
}
export type World = BitecsWorld<WorldProps>;

export type Component<T> = Record<number, T>;

export interface DataPoint {
  timestamp: number;
  value: number;
}

export class RingBuffer<T> {
  private buffer: T[];
  private writeIndex = 0;
  private size = 0;
  private readonly maxSize: number;

  constructor(capacity: number) {
    this.maxSize = capacity;
    this.buffer = Array.from({ length: capacity });
  }

  push(item: T): void {
    this.buffer[this.writeIndex] = item;
    this.writeIndex = (this.writeIndex + 1) % this.maxSize;
    this.size = Math.min(this.size + 1, this.maxSize);
  }

  /**
   * Returns the underlying buffer array directly.
   * The array is structured as [newest...oldest] when full.
   * @returns Array of items in chronological order (oldest to newest)
   */
  toArray(): T[] {
    if (this.size === 0) return [];
    if (this.size < this.maxSize) {
      return this.buffer.slice(0, this.size);
    }

    // Return the buffer in chronological order (oldest to newest)
    // This avoids creating a new array by returning the buffer directly
    const newerHalf = this.buffer.slice(this.writeIndex);
    const olderHalf = this.buffer.slice(0, this.writeIndex);
    return [...newerHalf, ...olderHalf];
  }

  clear(): void {
    this.writeIndex = 0;
    this.size = 0;
  }

  getSize(): number {
    return this.size;
  }
}

export interface DataSeries {
  name: string;
  data: DataPoint[];
}

export interface MapDimensions {
  height: number;
  width: number;
}

export interface SpawnPoint {
  id: string;
  name: string;
  type: "player" | "npc" | "enemy";
  x: number;
  y: number;
}

export interface EditorCamera {
  x: number;
  y: number;
  zoom: number;
}

export interface EditorState {
  camera: EditorCamera;
  gridSettings: {
    enabled: boolean;
    size: number;
    snapToGrid: boolean;
  };
  layerVisibility: Record<string, boolean>;
  selectedEntities: number[];
}

export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // in milliseconds
  maxAutoSaves: number;
  onAutoSave?: (metadata: MapMetadata) => void;
  onAutoSaveError?: (error: Error) => void;
}
// Validation schemas
export const mapNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/, {
    message:
      "Map name must contain only lowercase letters, numbers, and hyphens",
  });

export const mapDimensionsSchema = z.object({
  height: z.number().positive(),
  width: z.number().positive(),
});

export const spawnPointSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["player", "npc", "enemy"]),
  x: z.number(),
  y: z.number(),
});

export const editorCameraSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number(),
});

export const editorStateSchema = z.object({
  camera: editorCameraSchema,
  gridSettings: z.object({
    enabled: z.boolean(),
    size: z.number().positive(),
    snapToGrid: z.boolean(),
  }),
  layerVisibility: z.record(z.boolean()),
  selectedEntities: z.array(z.number()),
});

export const mapMetadataSchema = z.object({
  author: z.string().optional(),
  autoSave: z
    .object({
      lastAutoSave: z.string(),
      sequence: z.number(),
    })
    .optional(),
  createdAt: z.string().datetime(),
  description: z.string().optional(),
  dimensions: mapDimensionsSchema.optional(),
  editorState: editorStateSchema.optional(),
  isTemplate: z.boolean().optional(),
  lastEditedBy: z.string().optional(),
  name: mapNameSchema,
  parentMapId: z.string().optional(),
  schemaVersion: z.number().int().positive(),
  spawnPoints: z.array(spawnPointSchema).optional(),
  tags: z.array(z.string()).optional(),
  thumbnailUrl: z.string().url().optional(),
  updatedAt: z.string().datetime(),
  version: z.string(),
});

export const mapFileSchema = z.object({
  data: z.string(),
  metadata: mapMetadataSchema,
});

// Type exports
export type MapMetadata = z.infer<typeof mapMetadataSchema>;
export type MapFile = z.infer<typeof mapFileSchema>;
export interface MapBackup {
  backupDate: string;
  mapFile: MapFile;
}
