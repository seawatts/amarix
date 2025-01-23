"use client";

import type { PropsWithChildren } from "react";
import type { StoreApi } from "zustand";
import { createContext, useContext, useRef } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";

import type { GameStore } from "../lib/stores/game-state";
import { createGameStore, defaultInitState } from "../lib/stores/game-state";

type GameProviderProps = PropsWithChildren;

const GameStoreContext = createContext<StoreApi<GameStore>>(
  createGameStore(defaultInitState),
);

export function GameProvider({ children }: GameProviderProps) {
  const storeRef = useRef<StoreApi<GameStore>>(
    createGameStore(defaultInitState),
  );

  return (
    <GameStoreContext.Provider value={storeRef.current}>
      {children}
    </GameStoreContext.Provider>
  );
}

export function useGame<T>(
  selector: (state: GameStore) => T,
  equalityFn?: (left: T, right: T) => boolean,
): T {
  const store = useContext(GameStoreContext);
  return useStoreWithEqualityFn(store, selector, equalityFn);
}
