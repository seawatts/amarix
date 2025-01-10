import type { World as BitecsWorld } from "bitecs";

export type World = BitecsWorld;

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
