import type { World } from "bitecs";
import { query } from "bitecs";

import type { DebugStore } from "~/lib/stores/debug";
import type { GameStore } from "~/lib/stores/game-state";
import { Debug, KeyboardState, MouseState } from "../components";
import { isCommandKeyDown } from "../utils/keyboard";

interface DebugSystemContext {
  debugStore: DebugStore;
  gameStore: GameStore;
  world: World;
}

export function createDebugSystem(
  debugStore: DebugStore,
  gameStore: GameStore,
) {
  const lastPerformanceUpdate = { value: performance.now() };
  const PERFORMANCE_UPDATE_INTERVAL = 1000; // Update every second

  return function debugSystem(world: World, _deltaTime: number): World {
    const context: DebugSystemContext = {
      debugStore,
      gameStore,
      world,
    };

    // Update performance metrics periodically
    const currentTime = performance.now();
    if (
      currentTime - lastPerformanceUpdate.value >
      PERFORMANCE_UPDATE_INTERVAL
    ) {
      updatePerformanceMetrics(context);
      lastPerformanceUpdate.value = currentTime;
    }

    // Get all entities with Debug components
    const debugEntities = query(world, [Debug, KeyboardState, MouseState]);

    for (const eid of debugEntities) {
      const isCommandPressed = isCommandKeyDown(eid);

      if (isCommandPressed) {
        // Show bounding box when hovering with command key pressed
        if (Debug.hoveredEntity[eid] === 1) {
          Debug.showBoundingBox[eid] = 1;
          debugStore.visualizations.showBoundingBoxes = true;
          debugStore.toggleVisualization("showBoundingBoxes");
        }

        // Handle entity selection on command + click
        if (Debug.clickedEntity[eid] === 1) {
          Debug.isSelected[eid] = 1;
          debugStore.selectedEntityId = eid;
          debugStore.setSelectedEntityId(eid);
        }
      } else {
        // Reset debug flags when command key is not pressed
        Debug.showBoundingBox[eid] = 0;
        Debug.showColliders[eid] = 0;
        Debug.showForceVectors[eid] = 0;
        Debug.showVelocityVector[eid] = 0;
        Debug.showTriggerZones[eid] = 0;

        // Reset selection when command key is released
        Debug.isSelected[eid] = 0;
        debugStore.selectedEntityId = null;
        debugStore.setSelectedEntityId(null);
      }

      // Sync debug store state with components
      syncDebugStoreState(eid, context);
    }

    // Update game store
    // gameStore.update(world);

    return world;
  };
}

function updatePerformanceMetrics(context: DebugSystemContext) {
  const { gameStore } = context;
  const metrics = gameStore.metrics;

  if (!metrics) return;

  // Update memory usage
  if (performance.memory) {
    metrics.performance.memoryUsage = performance.memory.usedJSHeapSize;
    gameStore.metrics = metrics; // Update the store's metrics
    // gameStore.update(context.world);
  }
}

function syncDebugStoreState(entity: number, context: DebugSystemContext) {
  const { debugStore } = context;

  // Sync visualizations
  if (Debug.showBoundingBox[entity] === 1) {
    debugStore.visualizations.showBoundingBoxes = true;
    debugStore.toggleVisualization("showBoundingBoxes");
  }
  if (Debug.showColliders[entity] === 1) {
    debugStore.visualizations.showCollisionPoints = true;
    debugStore.toggleVisualization("showCollisionPoints");
  }
  if (Debug.showForceVectors[entity] === 1) {
    debugStore.visualizations.showForceVectors = true;
    debugStore.toggleVisualization("showForceVectors");
  }
  if (Debug.showVelocityVector[entity] === 1) {
    debugStore.visualizations.showVelocityVectors = true;
    debugStore.toggleVisualization("showVelocityVectors");
  }
  if (Debug.showTriggerZones[entity] === 1) {
    debugStore.visualizations.showTriggerZones = true;
    debugStore.toggleVisualization("showTriggerZones");
  }
}
