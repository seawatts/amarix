"use client";

import type { createWorld, World } from "bitecs";
import { entityExists, getAllEntities, getEntityComponents } from "bitecs";
import { createStore } from "zustand/vanilla";

import type { GameEngine } from "../ecs/engine";
import { Debug, Named } from "../ecs/components";

interface State {
  engine: GameEngine | null;
  metrics: GameMetrics | null;
  lastFrameTime: number;
  world: ReturnType<typeof createWorld> | null;
}

interface GameMetrics {
  entities: {
    id: number;
    name?: string;
    components: Record<
      string,
      {
        data: Record<string, unknown>;
        component: ComponentType;
      }
    >;
  }[];
  performance: {
    fps: number;
    frameTime: number;
    memoryUsage: number;
    systems: Record<string, number>;
  };
}

type ComponentType = Record<string, unknown>;

export const defaultInitState: State = {
  engine: null,
  lastFrameTime: 0,
  metrics: null,
  world: null,
};

export type GameStore = State & {
  reset: () => void;
  setEngine: (engine: GameEngine | null) => void;
  setWorld: (world: World | null) => void;
  update: (world: World, systemPerformance?: Record<string, number>) => void;
};

export const createGameStore = (initState: State = defaultInitState) => {
  return createStore<GameStore>((set, get) => ({
    ...initState,
    reset: () => set(defaultInitState),
    setEngine: (engine) => set({ engine }),
    setWorld: (world) => set({ world }),
    update: (world, systemPerformance: Record<string, number> = {}) => {
      const currentTime = performance.now();
      const lastFrameTime = get().lastFrameTime;
      const frameTime = currentTime - lastFrameTime;
      const fps = 1000 / frameTime;

      // Get all entities and their components
      const allEntities = getAllEntities(world);
      const entities = allEntities
        .filter((eid) => entityExists(world, eid))
        .map((eid) => {
          const components = getEntityComponents(world, eid) as ComponentType[];
          const componentData: Record<
            string,
            {
              data: Record<string, unknown>;
              component: ComponentType;
            }
          > = {};

          for (const component of components) {
            // Get the component data
            const data: Record<string, unknown> = {};

            // Handle array-based components (TypedArrays)
            for (const [key, value] of Object.entries(component)) {
              if (ArrayBuffer.isView(value)) {
                data[key] = (value as unknown as ArrayLike<unknown>)[eid];
              } else if (Array.isArray(value)) {
                data[key] = value[eid];
              }
            }

            // Only add components that have data
            if (Object.keys(data).length > 0) {
              componentData[(component as any)._name] = {
                component,
                data,
              };
            }
          }

          return {
            components: componentData,
            id: eid,
            name: Named.name[eid] ?? Debug.toString[eid]?.(),
          };
        });

      const metrics: GameMetrics = {
        entities,
        performance: {
          fps,
          frameTime,
          memoryUsage: performance.memory?.usedJSHeapSize ?? 0,
          systems: {
            ...systemPerformance,
            GameState: performance.now() - currentTime,
          },
        },
      };

      set({ lastFrameTime: currentTime, metrics });
    },
  }));
};
