import type { World as BitecsWorld } from "bitecs";

export type World = BitecsWorld;

export type Component<T> = Record<number, T>;

export interface DataPoint {
  timestamp: number;
  value: number;
}

export interface DataSeries {
  name: string;
  data: DataPoint[];
}
