"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useRef } from "react";
import { useStore } from "zustand";

import type { GameStore } from "~/lib/stores/game-state";
import { GameEngine } from "~/lib/ecs/engine";
import { createGameStore, defaultInitState } from "~/lib/stores/game-state";

export type GameStoreApi = ReturnType<typeof createGameStore>;

interface GameContextValue {
  store: GameStoreApi;
}

export const GameContext = createContext<GameContextValue | null>(null);

export interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const storeRef = useRef<GameStoreApi>(createGameStore(defaultInitState));
  const engineRef = useRef<GameEngine | null>(null);

  const initializeEngine = (canvas: HTMLCanvasElement) => {
    if (engineRef.current) {
      return engineRef.current;
    }

    const engine = new GameEngine(canvas, storeRef.current.getState());
    engineRef.current = engine;
    // storeRef.current.getState().setEngine(engine);
    engine.start();
    return engine;
  };

  const cleanupEngine = () => {
    if (!engineRef.current) {
      return;
    }

    engineRef.current.cleanup();
    engineRef.current = null;
    // storeRef.current.getState().setEngine(null);
  };

  return (
    <GameContext.Provider
      value={{
        store: storeRef.current,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame<T>(selector: (store: GameStore) => T): T {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameStore must be used within GameProvider");
  }
  return useStore(context.store, selector);
}
