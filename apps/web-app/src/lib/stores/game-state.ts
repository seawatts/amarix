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

export interface GameMetrics {
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

interface ExtendedPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
  };
}

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
    reset: () => {
      set(defaultInitState);
    },
    setEngine: (engine) => set({ engine }),
    setWorld: (world) => set({ world }),
    update: (world, systemPerformance: Record<string, number> = {}) => {
      const currentTime = performance.now();
      const lastFrameTime = get().lastFrameTime;
      const frameTime = currentTime - lastFrameTime;
      const fps = Math.round(1000 / frameTime);

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
            const componentName = component._name as string;

            // Handle array-based components (TypedArrays)
            for (const [key, value] of Object.entries(component)) {
              if (key === "_name") continue;

              // Handle string arrays
              if (Array.isArray(value)) {
                if (value[eid] !== undefined) {
                  data[key] = value[eid];
                }
              }
              // Handle TypedArrays
              else if (ArrayBuffer.isView(value)) {
                const arrayValue = value as
                  | Float32Array
                  | Int32Array
                  | Uint32Array
                  | Uint8Array;
                if (arrayValue[eid] !== undefined) {
                  data[key] = arrayValue[eid];
                }
              }
            }

            // Only add components that have data
            if (Object.keys(data).length > 0) {
              componentData[componentName] = {
                component,
                data,
              };
            }
          }

          // Get entity name from Named or Debug component
          let name = Named.name[eid];
          if (name === undefined && Debug.toString[eid]) {
            name = Debug.toString[eid]?.();
          }

          // Add Named component if it exists
          if (Named.name[eid] !== undefined) {
            componentData.Named = {
              component: Named,
              data: {
                name: Named.name[eid],
              },
            };
          }

          // Add Debug component if it exists
          if (Debug.toString[eid]) {
            componentData.Debug = {
              component: Debug,
              data: {
                toString: Debug.toString[eid],
              },
            };
          }

          return {
            components: componentData,
            id: eid,
            name,
          };
        });

      const metrics: GameMetrics = {
        entities,
        performance: {
          fps,
          frameTime,
          memoryUsage:
            (performance as ExtendedPerformance).memory?.usedJSHeapSize ?? 0,
          systems: {
            ...systemPerformance,
            GameState: Math.round(performance.now() - currentTime),
          },
        },
      };

      set({ lastFrameTime: currentTime, metrics });
    },
  }));
};
