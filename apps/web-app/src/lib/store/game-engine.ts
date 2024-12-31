import { create } from "zustand";

import type { GameEngine } from "../ecs/engine";

interface GameEngineStore {
  engine: GameEngine | null;
  setEngine: (engine: GameEngine | null) => void;
}

export const useGameEngine = create<GameEngineStore>((set) => ({
  engine: null,
  setEngine: (engine) => set({ engine }),
}));
