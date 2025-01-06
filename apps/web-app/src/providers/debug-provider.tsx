"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useRef } from "react";
import { useStore } from "zustand";

import type { DebugStore } from "~/lib/stores/debug";
import { createDebugStore } from "~/lib/stores/debug";

export type DebugStoreApi = ReturnType<typeof createDebugStore>;

export const DebugStoreContext = createContext<DebugStoreApi | undefined>(
  undefined,
);

export interface DebugStoreProviderProps {
  children: ReactNode;
}

export const DebugStoreProvider = ({ children }: DebugStoreProviderProps) => {
  const storeRef = useRef<DebugStoreApi>(null);
  if (!storeRef.current) {
    storeRef.current = createDebugStore();
  }

  return (
    <DebugStoreContext.Provider value={storeRef.current}>
      {children}
    </DebugStoreContext.Provider>
  );
};

export const useDebugStore = <T,>(selector: (store: DebugStore) => T): T => {
  const debugStoreContext = useContext(DebugStoreContext);

  if (!debugStoreContext) {
    throw new Error("useDebugStore must be used within DebugStoreProvider");
  }

  return useStore(debugStoreContext, selector);
};
