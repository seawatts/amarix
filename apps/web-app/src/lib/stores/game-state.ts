"use client";

import { createStore } from "zustand/vanilla";

import type { World } from "../ecs/types";
import { GameEngine } from "../ecs/engine";

interface State {
  engine: GameEngine | null;
  world: World | null;
}

export const defaultInitState: State = {
  engine: null,
  world: null,
};

export type GameStore = State & {
  reset: () => void;
  setWorld: (world: World | null) => void;
  update: (world: World) => void;
  initializeEngine: (canvas: HTMLCanvasElement) => GameEngine;
};

export const createGameStore = (initState: State = defaultInitState) => {
  return createStore<GameStore>((set, get) => ({
    ...initState,
    initializeEngine: (canvas) => {
      const engine = new GameEngine(canvas, get());
      engine.start();
      set({ engine });
      return engine;
    },
    reset: () => {
      set(defaultInitState);
    },
    setWorld: (world) => set({ world }),
    update: (_world) => {
      // No-op for now
    },
  }));
};
