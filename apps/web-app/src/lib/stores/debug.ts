import type { World } from "bitecs";
import { query } from "bitecs";
import { createStore } from "zustand/vanilla";

import { Clickable } from "../ecs/components";

interface DebugState {
  selectedEntityId: number | null;
  systems: {
    animation: boolean;
    battle: boolean;
    collision: boolean;
    keyboard: boolean;
    mouse: boolean;
    movement: boolean;
    npcInteraction: boolean;
    particle: boolean;
    physics: boolean;
    scene: boolean;
    script: boolean;
    sound: boolean;
    sprite: boolean;
    trigger: boolean;
  };
  visualizations: {
    showBoundingBoxes: boolean;
    showCollisionPoints: boolean;
    showForceVectors: boolean;
    showParticleEmitters: boolean;
    showPolygons: boolean;
    showTriggerZones: boolean;
    showVelocityVectors: boolean;
  };
  metrics: DebugMetrics | null;
  lastFrameTime: number;
}

interface DebugMetrics {
  performance: {
    fps: number;
    frameTime: number;
    memoryUsage: number;
    systems: Record<string, number>;
  };
}

export type DebugStore = DebugState & {
  setSelectedEntityId: (id: number | null) => void;
  toggleSystem: (system: keyof DebugState["systems"]) => void;
  toggleVisualization: (viz: keyof DebugState["visualizations"]) => void;
  update: (world: World) => void;
};

export const defaultInitState: DebugState = {
  lastFrameTime: 0,
  metrics: null,
  selectedEntityId: null,
  systems: {
    animation: true,
    battle: true,
    collision: true,
    keyboard: true,
    mouse: true,
    movement: true,
    npcInteraction: true,
    particle: true,
    physics: true,
    scene: true,
    script: true,
    sound: true,
    sprite: true,
    trigger: true,
  },
  visualizations: {
    showBoundingBoxes: false,
    showCollisionPoints: false,
    showForceVectors: false,
    showParticleEmitters: false,
    showPolygons: false,
    showTriggerZones: false,
    showVelocityVectors: false,
  },
};

export const createDebugStore = (initState: DebugState = defaultInitState) => {
  return createStore<DebugStore>((set, get) => ({
    ...initState,
    setSelectedEntityId: (id) => set({ selectedEntityId: id }),
    toggleSystem: (system) =>
      set((state) => ({
        systems: {
          ...state.systems,
          [system]: !state.systems[system],
        },
      })),
    toggleVisualization: (viz) =>
      set((state) => ({
        visualizations: {
          ...state.visualizations,
          [viz]: !state.visualizations[viz],
        },
      })),
    update: (world) => {
      const clickedEntities = query(world, [Clickable]);

      const clickedEntity = clickedEntities.find(
        (eid) => Clickable.isClicked[eid] === 1,
      );

      if (clickedEntity) {
        set({
          selectedEntityId: clickedEntity,
        });
      }
    },
  }));
};
