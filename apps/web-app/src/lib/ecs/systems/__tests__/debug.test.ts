import type { World } from "bitecs";
import { addComponent, addEntity, createWorld } from "bitecs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DebugStore } from "~/lib/stores/debug";
import type { GameStore } from "~/lib/stores/game-state";
import { Debug, KeyboardState, MouseState } from "../../components";
import { createDebugSystem } from "../debug";

describe("Debug System", () => {
  let world: World;
  let eid: number;
  let mockDebugStore: DebugStore;
  let mockGameStore: GameStore;

  beforeEach(() => {
    world = createWorld();
    eid = addEntity(world);

    // Set up debug entity
    addComponent(world, eid, Debug);
    addComponent(world, eid, KeyboardState);
    addComponent(world, eid, MouseState);

    // Mock debug store
    mockDebugStore = {
      lastFrameTime: 0,
      metrics: {
        performance: {
          fps: 60,
          frameTime: 16.67,
          memoryUsage: 0,
          systems: {},
        },
      },
      selectedEntityId: null,
      setSelectedEntityId: vi.fn(),
      systems: {
        animation: false,
        battle: false,
        collision: false,
        keyboard: false,
        mouse: false,
        movement: false,
        npcInteraction: false,
        particle: false,
        physics: false,
        scene: false,
        script: false,
        sound: false,
        sprite: false,
        trigger: false,
      },
      toggleSystem: vi.fn(),
      toggleVisualization: vi.fn(),
      update: vi.fn(),
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

    // Mock game store
    mockGameStore = {
      engine: null,
      lastFrameTime: 0,
      metrics: {
        entities: [],
        performance: {
          fps: 60,
          frameTime: 16.67,
          memoryUsage: 0,
          systems: {},
        },
      },
      reset: vi.fn(),
      setEngine: vi.fn(),
      setWorld: vi.fn(),
      update: vi.fn(),
      world: null,
    };

    // Mock performance.memory
    vi.stubGlobal("performance", {
      memory: {
        usedJSHeapSize: 1_000_000,
      },
      now: () => 1000,
    });
  });

  it("should show bounding boxes when command key is pressed and entity is hovered", () => {
    // Set up command key and hover state
    KeyboardState.keys[eid] = 1 << 4; // Command key
    Debug.hoveredEntity[eid] = 1;

    const debugSystem = createDebugSystem(mockDebugStore, mockGameStore);
    debugSystem(world, 1 / 60);

    // Verify bounding box is shown
    expect(Debug.showBoundingBox[eid]).toBe(1);
    expect(mockDebugStore.toggleVisualization).toHaveBeenCalledWith(
      "showBoundingBoxes",
    );
  });

  it("should select entity when command key is pressed and entity is clicked", () => {
    // Set up command key and click state
    KeyboardState.keys[eid] = 1 << 4; // Command key
    Debug.clickedEntity[eid] = 1;

    const debugSystem = createDebugSystem(mockDebugStore, mockGameStore);
    debugSystem(world, 1 / 60);

    // Verify entity was selected
    expect(Debug.isSelected[eid]).toBe(1);
    expect(mockDebugStore.setSelectedEntityId).toHaveBeenCalledWith(eid);
  });

  it("should update performance metrics periodically", () => {
    const debugSystem = createDebugSystem(mockDebugStore, mockGameStore);
    debugSystem(world, 1 / 60);

    // Verify metrics were updated
    expect(mockGameStore.metrics?.performance.memoryUsage).toBe(1_000_000);
  });

  it("should sync debug store state with components", () => {
    // Set up debug flags
    Debug.showBoundingBox[eid] = 1;
    Debug.showColliders[eid] = 1;
    Debug.showForceVectors[eid] = 1;
    Debug.showVelocityVector[eid] = 1;
    Debug.showTriggerZones[eid] = 1;

    const debugSystem = createDebugSystem(mockDebugStore, mockGameStore);
    debugSystem(world, 1 / 60);

    // Verify all visualizations were synced
    expect(mockDebugStore.toggleVisualization).toHaveBeenCalledWith(
      "showBoundingBoxes",
    );
    expect(mockDebugStore.toggleVisualization).toHaveBeenCalledWith(
      "showCollisionPoints",
    );
    expect(mockDebugStore.toggleVisualization).toHaveBeenCalledWith(
      "showForceVectors",
    );
    expect(mockDebugStore.toggleVisualization).toHaveBeenCalledWith(
      "showVelocityVectors",
    );
    expect(mockDebugStore.toggleVisualization).toHaveBeenCalledWith(
      "showTriggerZones",
    );
  });

  it("should reset debug flags when command key is not pressed", () => {
    // Set up initial debug flags
    Debug.showBoundingBox[eid] = 1;
    Debug.showColliders[eid] = 1;
    Debug.showForceVectors[eid] = 1;
    Debug.showVelocityVector[eid] = 1;
    Debug.showTriggerZones[eid] = 1;

    // Run system without command key pressed
    const debugSystem = createDebugSystem(mockDebugStore, mockGameStore);
    debugSystem(world, 1 / 60);

    // Verify debug flags were reset
    expect(Debug.showBoundingBox[eid]).toBe(0);
    expect(Debug.showColliders[eid]).toBe(0);
    expect(Debug.showForceVectors[eid]).toBe(0);
    expect(Debug.showVelocityVector[eid]).toBe(0);
    expect(Debug.showTriggerZones[eid]).toBe(0);
  });
});
