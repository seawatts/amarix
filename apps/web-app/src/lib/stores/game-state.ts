"use client";

import { createStore } from "zustand/vanilla";

import type { GameSystem, World } from "../ecs/types";
import { GameEngine } from "../ecs/engine";

interface State {
  // currentMap: MapMetadata | null;
  engine: GameEngine | null;
  // isDirty: boolean;
  // isLoading: boolean;
  // isSaving: boolean;
}

export const defaultInitState: State = {
  // currentMap: null,
  engine: null,
  // isDirty: false,
  // isLoading: false,
  // isSaving: false,
};

export type GameStore = State & {
  initializeEngine: (props: {
    canvas: HTMLCanvasElement;
    world: World;
    systems: {
      name: string;
      system: GameSystem;
      isPaused?: boolean;
    }[];
  }) => GameEngine;
  // loadMap: (filePath: string) => Promise<void>;
  // markDirty: () => void;
  // reset: () => void;
  // saveCurrentMap: () => Promise<void>;
  // setCurrentMap: (map: MapMetadata) => void;
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

    // loadMap: async (filePath: string) => {
    //   const { engine } = get();
    //   if (!engine?.world) {
    //     throw new Error("Engine not initialized");
    //   }

    //   set({ isLoading: true });
    //   try {
    //     // await loadMap(engine.world, filePath);
    //     set({ isDirty: false, isLoading: false });
    //   } catch (error) {
    //     set({ isLoading: false });
    //     throw error;
    //   }
    // },

    // markDirty: () => {
    //   set({ isDirty: true });
    // },

    reset: () => {
      set(defaultInitState);
    },

    // saveCurrentMap: async () => {
    //   const { engine, currentMap } = get();
    //   if (!engine?.world || !currentMap) {
    //     throw new Error("No map to save");
    //   }

    //   set({ isSaving: true });
    //   try {
    //     // await saveMap(engine.world, currentMap);
    //     set({ isDirty: false, isSaving: false });
    //   } catch (error) {
    //     set({ isSaving: false });
    //     throw error;
    //   }
    // },

    // setCurrentMap: (map: MapMetadata) => {
    //   set({ currentMap: map });
    // },
  }));
};
