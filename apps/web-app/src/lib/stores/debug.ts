import { createStore } from "zustand/vanilla";

interface DebugState {
  isDebugging: boolean;
  isPaused: boolean;
  selectedEntityId: number | null;
  sidebarSections: {
    performance: boolean;
    ecs: boolean;
    systems: boolean;
    visualizations: boolean;
  };
  systems: Record<string, { isEnabled: boolean; isPaused: boolean }>;
  visualizations: Record<string, boolean>;
  metrics: DebugMetrics | null;
}

interface EntityMetrics {
  id: number;
  name?: string;
  components: Record<
    string,
    {
      data: Record<string, unknown>;
      component: Record<string, unknown>;
    }
  >;
}

interface DebugMetrics {
  entities: EntityMetrics[];
  performance: {
    fps: number;
    frameTime: number;
    memoryUsage: number;
    systems: Record<string, number>;
  };
}

export interface DebugUpdateEvent {
  type: "entitySelected" | "metricsUpdated";
  data: {
    selectedEntityId?: number | null;
    metrics?: {
      entities?: EntityMetrics[];
      fps?: number;
      frameTime?: number;
      memoryUsage?: number;
      systems?: Record<string, number>;
    };
  };
}

export type DebugStore = DebugState & {
  setSelectedEntityId: (id: number | null) => void;
  getSystems: () => DebugState["systems"];
  setIsDebugging: (isDebugging: boolean) => void;
  setIsPaused: (isPaused: boolean) => void;
  toggleSystem: (system: keyof DebugState["systems"]) => void;
  toggleSystemPause: (system: keyof DebugState["systems"]) => void;
  toggleVisualization: (viz: keyof DebugState["visualizations"]) => void;
  toggleSidebarSection: (section: keyof DebugState["sidebarSections"]) => void;
  setSystems: (systems: DebugState["systems"]) => void;
  handleDebugEvent: (event: DebugUpdateEvent) => void;
};

export const defaultInitState: DebugState = {
  isDebugging: false,
  isPaused: false,
  metrics: {
    entities: [],
    performance: {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      systems: {},
    },
  },
  selectedEntityId: null,
  sidebarSections: {
    ecs: false,
    performance: false,
    systems: false,
    visualizations: false,
  },
  systems: {},
  visualizations: {
    showBoundingBoxes: true,
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
    getSystems: () => get().systems,
    handleDebugEvent: (event) => {
      switch (event.type) {
        case "entitySelected": {
          if (event.data.selectedEntityId !== undefined) {
            set({ selectedEntityId: event.data.selectedEntityId });
          }
          break;
        }
        case "metricsUpdated": {
          if (event.data.metrics) {
            const currentState = get();
            set({
              metrics: {
                entities: event.data.metrics.entities ?? [],
                // currentState.metrics?.entities,
                // [],
                performance: {
                  fps:
                    event.data.metrics.fps ??
                    currentState.metrics?.performance.fps ??
                    60,
                  frameTime:
                    event.data.metrics.frameTime ??
                    currentState.metrics?.performance.frameTime ??
                    16.67,
                  memoryUsage:
                    event.data.metrics.memoryUsage ??
                    currentState.metrics?.performance.memoryUsage ??
                    0,
                  systems:
                    event.data.metrics.systems ??
                    currentState.metrics?.performance.systems ??
                    {},
                },
              },
            });
          }
          break;
        }
      }
    },
    setIsDebugging: (isDebugging) => set({ isDebugging }),
    setIsPaused: (isPaused) => set({ isPaused }),
    setSelectedEntityId: (id) => set({ selectedEntityId: id }),
    setSystems: (systems) => set({ systems }),
    toggleSidebarSection: (section) =>
      set((state) => ({
        sidebarSections: {
          ...state.sidebarSections,
          [section]: !state.sidebarSections[section],
        },
      })),
    toggleSystem: (system) =>
      set((state) => ({
        systems: {
          ...state.systems,
          [system]: {
            isEnabled: !(state.systems[system]?.isEnabled ?? true),
            isPaused: state.systems[system]?.isPaused ?? false,
          },
        },
      })),
    toggleSystemPause: (system) =>
      set((state) => ({
        systems: {
          ...state.systems,
          [system]: {
            isEnabled: state.systems[system]?.isEnabled ?? true,
            isPaused: !(state.systems[system]?.isPaused ?? false),
          },
        },
      })),
    toggleVisualization: (viz) =>
      set((state) => ({
        visualizations: {
          ...state.visualizations,
          [viz]: !state.visualizations[viz],
        },
      })),
  }));
};
