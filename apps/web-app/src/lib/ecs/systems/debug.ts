import {
  entityExists,
  getAllEntities,
  getEntityComponents,
  query,
} from "bitecs";

import type { World } from "../types";
import type { DebugStore, DebugUpdateEvent } from "~/lib/stores/debug";
import { Debug, Named } from "../components";
import { isCommandKeyDown } from "../utils/keyboard";

interface ComponentType {
  _name: string;
  [key: string]: unknown;
}

interface DebugSystemContext {
  debugStore: DebugStore;
  world: World;
}

export function createDebugSystem(debugStore: DebugStore) {
  const lastPerformanceUpdate = { value: performance.now() };
  // const PERFORMANCE_UPDATE_INTERVAL = 1000; // Update every second

  return function debugSystem(world: World) {
    const context: DebugSystemContext = {
      debugStore,
      world,
    };

    // Update performance metrics periodically
    const currentTime = performance.now();
    // if (
    // currentTime - lastPerformanceUpdate.value >
    // PERFORMANCE_UPDATE_INTERVAL
    // ) {
    updateMetrics(context, currentTime);
    // lastPerformanceUpdate.value = currentTime;
    // }

    // Get all entities with Debug components
    const debugEntities = query(world, [Debug]);

    for (const eid of debugEntities) {
      const isCommandPressed = isCommandKeyDown(eid);

      if (isCommandPressed) {
        // Show bounding box when hovering with command key pressed
        if (Debug.hoveredEntity[eid] === 1) {
          Debug.showBoundingBox[eid] = 1;
          debugStore.toggleVisualization("showBoundingBoxes");
        }

        // Handle entity selection on command + click
        if (Debug.clickedEntity[eid] === 1) {
          Debug.isSelected[eid] = 1;
          const event: DebugUpdateEvent = {
            data: { selectedEntityId: eid },
            type: "entitySelected",
          };
          debugStore.handleDebugEvent(event);
        }
      } else {
        // Reset debug flags when command key is not pressed
        Debug.showBoundingBox[eid] = 0;
        Debug.showColliders[eid] = 0;
        Debug.showForceVectors[eid] = 0;
        Debug.showVelocityVector[eid] = 0;
        Debug.showTriggerZones[eid] = 0;
      }

      // Sync debug store state with components
      syncDebugStoreState(eid, context);
    }
  };
}

function updateMetrics(context: DebugSystemContext, currentTime: number) {
  const { world, debugStore } = context;
  const lastFrameTime = world.timing.lastFrame;
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
          component: Record<string, unknown>;
        }
      > = {};

      for (const component of components) {
        // Get the component data
        const data: Record<string, unknown> = {};
        const componentName = component._name;

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

      return {
        components: componentData,
        id: eid,
        name,
      };
    });

  // Create metrics update event
  const event: DebugUpdateEvent = {
    data: {
      metrics: {
        entities,
        fps,
        frameTime,
        memoryUsage: performance.memory?.usedJSHeapSize ?? 0,
        systems: debugStore.metrics?.performance.systems ?? {},
      },
    },
    type: "metricsUpdated",
  };

  context.debugStore.handleDebugEvent(event);
}

function syncDebugStoreState(entity: number, context: DebugSystemContext) {
  const { debugStore } = context;

  // Sync visualizations
  if (Debug.showBoundingBox[entity] === 1) {
    debugStore.toggleVisualization("showBoundingBoxes");
  }
  if (Debug.showColliders[entity] === 1) {
    debugStore.toggleVisualization("showCollisionPoints");
  }
  if (Debug.showForceVectors[entity] === 1) {
    debugStore.toggleVisualization("showForceVectors");
  }
  if (Debug.showVelocityVector[entity] === 1) {
    debugStore.toggleVisualization("showVelocityVectors");
  }
  if (Debug.showTriggerZones[entity] === 1) {
    debugStore.toggleVisualization("showTriggerZones");
  }
}
