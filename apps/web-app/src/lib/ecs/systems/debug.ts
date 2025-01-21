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
  return function debugSystem(world: World) {
    const context: DebugSystemContext = {
      debugStore,
      world,
    };

    // Update performance metrics
    updateMetrics(context);

    // Get all entities with Debug components
    const debugEntities = query(world, [Debug]);

    for (const eid of debugEntities) {
      // Update performance metrics
      Debug.frameTime[eid] = world.timing.delta;
      Debug.lastUpdated[eid] = performance.now();

      // Check if command key is pressed
      const isCommandPressed = isCommandKeyDown();

      // Show debug visualizations when command key is pressed and entity is hovered
      if (isCommandPressed && Debug.hoveredEntity[eid]) {
        Debug.showBoundingBox[eid] = 1;
        Debug.showColliders[eid] = 1;
        Debug.showForceVectors[eid] = 1;
        Debug.showVelocityVector[eid] = 1;
        Debug.showTriggerZones[eid] = 1;
        Debug.showOrigin[eid] = 1;

        // Sync with debug store
        debugStore.toggleVisualization("showBoundingBoxes");
        debugStore.toggleVisualization("showCollisionPoints");
        debugStore.toggleVisualization("showForceVectors");
        debugStore.toggleVisualization("showVelocityVectors");
        debugStore.toggleVisualization("showTriggerZones");
      } else {
        // Reset visualizations when command key is not pressed
        Debug.showBoundingBox[eid] = 0;
        Debug.showColliders[eid] = 0;
        Debug.showForceVectors[eid] = 0;
        Debug.showVelocityVector[eid] = 0;
        Debug.showTriggerZones[eid] = 0;
        Debug.showOrigin[eid] = 0;
      }

      // Select entity when command key is pressed and entity is clicked
      if (isCommandPressed && Debug.clickedEntity[eid]) {
        Debug.isSelected[eid] = 1;
        debugStore.setSelectedEntityId(eid);
      }

      // Sync debug store state with components
      syncDebugStoreState(eid, context);
    }
  };
}

function updateMetrics(context: DebugSystemContext) {
  const { world, debugStore } = context;

  // Calculate FPS using the world's delta time which is more stable
  const fps = world.timing.delta > 0 ? Math.round(1 / world.timing.delta) : 60;

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
        frameTime: world.timing.delta * 1000,
        memoryUsage: performance.memory?.usedJSHeapSize ?? 0,
        systems: debugStore.metrics?.performance.systems ?? {},
      },
    },
    type: "metricsUpdated",
  };

  context.debugStore.handleDebugEvent(event);
}

function syncDebugStoreState(_entity: number, _context: DebugSystemContext) {
  // Currently not using store sync
}
