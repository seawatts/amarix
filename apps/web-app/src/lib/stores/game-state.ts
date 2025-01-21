"use client";

import { createStore } from "zustand/vanilla";

import type { GameSystem, World } from "../ecs/types";
import { GameEngine } from "../ecs/engine";

interface State {
  engine: GameEngine | null;
}

export const defaultInitState: State = {
  engine: null,
};

export type GameStore = State & {
  reset: () => void;
  initializeEngine: (props: {
    canvas: HTMLCanvasElement;
    world: World;
    systems: {
      name: string;
      system: GameSystem;
      isPaused?: boolean;
    }[];
  }) => GameEngine;
};

export const createGameStore = (initState: State = defaultInitState) => {
  return createStore<GameStore>((set, get) => ({
    ...initState,
    initializeEngine: (props) => {
      const { canvas, world, systems } = props;
      const engine = new GameEngine({ canvas, store: get(), systems, world });
      engine.start();
      set({ engine });
      return engine;
    },

    reset: () => {
      set(defaultInitState);
    },
  }));
};
