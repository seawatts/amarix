import type { createWorld, World } from "bitecs";
import { query } from "bitecs";
import { createStore } from "zustand/vanilla";

import type { GameEngine } from "../ecs/engine";
import {
  BattleState,
  CurrentPlayer,
  HostileNPC,
  KeyboardState,
  MouseState,
  NPC,
  NPCInteraction,
  Position,
} from "~/lib/ecs/components";
import { getPressedKeys } from "~/lib/ecs/utils/keyboard";
import { getMouseState } from "~/lib/ecs/utils/mouse";

interface NPCState {
  id: number;
  position: {
    x: number;
    y: number;
  };
  isHostile: boolean;
  isInteracting: boolean;
}

interface State {
  engine: GameEngine | null;
  metrics: GameMetrics | null;
  npcs: NPCState[];
  lastFrameTime: number;
  world: ReturnType<typeof createWorld> | null;
}

interface Actions {
  setEngine: (engine: GameEngine | null) => void;
  setWorld: (world: World | null) => void;
  update: (world: World) => void;
  reset: () => void;
}

interface GameMetrics {
  playerPosition: {
    gridX: number;
    gridY: number;
  };
  battle: {
    isActive: boolean;
    currentTurn: "player" | "enemy" | null;
  };
  performance: {
    fps: number;
    frameTime: number;
    memoryUsage: number;
  };
  input: {
    pressedKeys: string[];
    mouse: {
      position: { x: number; y: number };
      buttons: {
        left: boolean;
        middle: boolean;
        right: boolean;
      };
      hoveredEntity: number;
      clickedEntity: number;
    };
  };
  componentCounts: {
    hostileNpc: number;
    inBattle: number;
    movement: number;
    npc: number;
    npcInteraction: number;
    player: number;
    position: number;
  };
}

export const defaultInitState: State = {
  engine: null,
  lastFrameTime: performance.now(),
  metrics: null,
  npcs: [],
  world: null,
};

export type GameStore = State & Actions;

export const createGameStore = (initState: State = defaultInitState) => {
  return createStore<GameStore>((set, get) => ({
    ...initState,
    reset: () => set(defaultInitState),
    setEngine: (engine) => set({ engine }),
    setWorld: (world) => set({ world }),
    update: (world) => {
      const currentTime = performance.now();
      const lastFrameTime = get().lastFrameTime;
      const frameTime = currentTime - lastFrameTime;
      const fps = 1000 / frameTime;

      // Get player metrics
      const playerEntities = query(world, [
        CurrentPlayer,
        Position,
        KeyboardState,
        MouseState,
      ]);
      const playerEid = playerEntities[0];

      let metrics: GameMetrics | null = null;

      if (playerEid) {
        const x = Position.x[playerEid] ?? 0;
        const y = Position.y[playerEid] ?? 0;

        // Get battle state
        const isActive = BattleState.isActive[playerEid] === 1;
        let currentTurn: "player" | "enemy" | null = null;
        if (isActive) {
          currentTurn = BattleState.turn[playerEid] === 0 ? "player" : "enemy";
        }

        // Get input state
        const pressedKeys = getPressedKeys(playerEid);
        const mouseState = getMouseState(playerEid);

        // Count components
        const hostileNpcEntities = query(world, [HostileNPC]).length;
        const npcEntities = query(world, [NPC]).length;
        const npcInteractionEntities = query(world, [NPCInteraction]).length;
        const positionEntities = query(world, [Position]).length;
        const playerEntitiesCount = playerEntities.length;
        const inBattleEntities = query(world, [BattleState]).length;

        metrics = {
          battle: {
            currentTurn,
            isActive,
          },
          componentCounts: {
            hostileNpc: hostileNpcEntities,
            inBattle: inBattleEntities,
            movement: positionEntities,
            npc: npcEntities,
            npcInteraction: npcInteractionEntities,
            player: playerEntitiesCount,
            position: positionEntities,
          },
          input: {
            mouse: mouseState,
            pressedKeys,
          },
          performance: {
            fps,
            frameTime,
            memoryUsage: performance.memory?.usedJSHeapSize ?? 0,
          },
          playerPosition: {
            gridX: Math.round(x / 50),
            gridY: Math.round(y / 50),
          },
        };
      }

      // Get NPC states
      const npcs: NPCState[] = [];
      const npcEntities = query(world, [NPC, Position]);

      for (const eid of npcEntities) {
        npcs.push({
          id: eid,
          isHostile: HostileNPC.isHostile[eid] === 1,
          isInteracting: NPCInteraction.isInteracting[eid] === 1,
          position: {
            x: Position.x[eid] ?? 0,
            y: Position.y[eid] ?? 0,
          },
        });
      }

      set({ lastFrameTime: currentTime, metrics, npcs });
    },
  }));
};
