import type { World } from "bitecs";
import { addEntity } from "bitecs";

import type { DebugStore } from "~/lib/stores/debug";
import type { GameStore } from "~/lib/stores/game-state";
import { Debug } from "../components";

interface DebugSystemContext {
  debugStore: DebugStore;
  gameStore: GameStore;
  world: World;
}

export function createDebugSystem(
  debugStore: DebugStore,
  gameStore: GameStore,
) {
  let debugEntity: number | null = null;
  let lastPerformanceUpdate = performance.now();
  const PERFORMANCE_UPDATE_INTERVAL = 1000; // Update every second

  return function debugSystem(world: World, deltaTime: number): World {
    const context: DebugSystemContext = {
      debugStore,
      gameStore,
      world,
    };

    // Create debug entity if it doesn't exist
    if (!debugEntity) {
      debugEntity = addEntity(world);
      // Initialize the debug component for this entity
      for (const key of Object.keys(Debug)) {
        if (
          key !== "_name" &&
          Array.isArray(Debug[key as keyof typeof Debug])
        ) {
          (Debug[key as keyof typeof Debug] as Float32Array | Uint8Array)[
            debugEntity
          ] = 0;
        }
      }
      initializeDebugEntity(debugEntity, context);
    }

    // Update debug entity
    if (debugEntity) {
      updateDebugEntity(debugEntity, deltaTime, context);
    }

    // Update performance metrics periodically
    const currentTime = performance.now();
    if (currentTime - lastPerformanceUpdate > PERFORMANCE_UPDATE_INTERVAL) {
      updatePerformanceMetrics(context);
      lastPerformanceUpdate = currentTime;
    }

    // Sync debug store state with components
    if (debugEntity) {
      syncDebugStoreState(debugEntity, context);
    }

    return world;
  };
}

function initializeDebugEntity(entity: number, context: DebugSystemContext) {
  const { debugStore } = context;

  // Initialize debug component values from store
  Debug.showBoundingBox[entity] = Number(
    debugStore.visualizations.showBoundingBoxes,
  );
  Debug.showColliders[entity] = Number(
    debugStore.visualizations.showCollisionPoints,
  );
  Debug.showForceVectors[entity] = Number(
    debugStore.visualizations.showForceVectors,
  );
  Debug.showVelocityVector[entity] = Number(
    debugStore.visualizations.showVelocityVectors,
  );
  Debug.showTriggerZones[entity] = Number(
    debugStore.visualizations.showTriggerZones,
  );
  Debug.showOrigin[entity] = 0;
  Debug.isPaused[entity] = 0;
  Debug.stepFrame[entity] = 0;
  Debug.logLevel[entity] = 3; // Default to INFO level
}

function updateDebugEntity(
  entity: number,
  deltaTime: number,
  context: DebugSystemContext,
) {
  const { debugStore, gameStore } = context;

  // Update timing metrics
  Debug.frameTime[entity] = deltaTime * 1000;
  Debug.updateTime[entity] = performance.now() - gameStore.lastFrameTime;
  Debug.physicsTime[entity] =
    gameStore.metrics?.performance.systems.physics ?? 0;
  Debug.renderTime[entity] = gameStore.metrics?.performance.systems.render ?? 0;

  // Update last updated timestamp
  Debug.lastUpdated[entity] = performance.now();

  // Update selected state
  Debug.isSelected[entity] = Number(debugStore.selectedEntityId === entity);
}

function updatePerformanceMetrics(context: DebugSystemContext) {
  const { gameStore } = context;
  const metrics = gameStore.metrics;

  if (!metrics) return;

  // Update memory usage
  if (performance.memory) {
    metrics.performance.memoryUsage = performance.memory.usedJSHeapSize;
  }
}

function syncDebugStoreState(entity: number, context: DebugSystemContext) {
  const { debugStore } = context;

  const setVisualization = (
    key: keyof DebugStore["visualizations"],
    value: boolean,
  ) => {
    if (debugStore.visualizations[key] !== value) {
      debugStore.toggleVisualization(key);
    }
  };

  // Sync visualizations
  setVisualization("showBoundingBoxes", Boolean(Debug.showBoundingBox[entity]));
  setVisualization("showCollisionPoints", Boolean(Debug.showColliders[entity]));
  setVisualization("showForceVectors", Boolean(Debug.showForceVectors[entity]));
  setVisualization(
    "showVelocityVectors",
    Boolean(Debug.showVelocityVector[entity]),
  );
  setVisualization("showTriggerZones", Boolean(Debug.showTriggerZones[entity]));
}
