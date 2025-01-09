import { addEntity, createWorld } from "bitecs";
import { describe, expect, it } from "vitest";

import { Clickable } from "../../ecs/components";
import { createDebugStore, defaultInitState } from "../debug";

describe("Debug Store", () => {
  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const store = createDebugStore();
      const state = store.getState();

      expect(state.selectedEntityId).toBeNull();
      expect(state.lastFrameTime).toBe(0);
      expect(state.metrics).toBeNull();

      // Check default system states
      expect(state.systems.animation).toBe(true);
      expect(state.systems.battle).toBe(true);
      expect(state.systems.collision).toBe(true);
      expect(state.systems.keyboard).toBe(true);
      expect(state.systems.mouse).toBe(true);
      expect(state.systems.movement).toBe(true);
      expect(state.systems.npcInteraction).toBe(true);
      expect(state.systems.particle).toBe(true);
      expect(state.systems.physics).toBe(true);
      expect(state.systems.scene).toBe(true);
      expect(state.systems.script).toBe(true);
      expect(state.systems.sound).toBe(true);
      expect(state.systems.sprite).toBe(true);
      expect(state.systems.trigger).toBe(true);

      // Check default visualization states
      expect(state.visualizations.showBoundingBoxes).toBe(false);
      expect(state.visualizations.showCollisionPoints).toBe(false);
      expect(state.visualizations.showForceVectors).toBe(false);
      expect(state.visualizations.showParticleEmitters).toBe(false);
      expect(state.visualizations.showPolygons).toBe(false);
      expect(state.visualizations.showTriggerZones).toBe(false);
      expect(state.visualizations.showVelocityVectors).toBe(false);
    });

    it("should initialize with custom state", () => {
      const customState = {
        ...defaultInitState,
        selectedEntityId: 1,
        systems: {
          ...defaultInitState.systems,
          animation: false,
        },
        visualizations: {
          ...defaultInitState.visualizations,
          showBoundingBoxes: true,
        },
      };

      const store = createDebugStore(customState);
      const state = store.getState();

      expect(state.selectedEntityId).toBe(1);
      expect(state.systems.animation).toBe(false);
      expect(state.visualizations.showBoundingBoxes).toBe(true);
    });
  });

  describe("State Updates", () => {
    it("should update selected entity", () => {
      const store = createDebugStore();
      store.getState().setSelectedEntityId(42);

      expect(store.getState().selectedEntityId).toBe(42);
    });

    it("should toggle system state", () => {
      const store = createDebugStore();
      const { toggleSystem } = store.getState();

      // Toggle animation system off
      toggleSystem("animation");
      expect(store.getState().systems.animation).toBe(false);

      // Toggle animation system back on
      toggleSystem("animation");
      expect(store.getState().systems.animation).toBe(true);
    });

    it("should toggle visualization state", () => {
      const store = createDebugStore();
      const { toggleVisualization } = store.getState();

      // Toggle bounding boxes on
      toggleVisualization("showBoundingBoxes");
      expect(store.getState().visualizations.showBoundingBoxes).toBe(true);

      // Toggle bounding boxes off
      toggleVisualization("showBoundingBoxes");
      expect(store.getState().visualizations.showBoundingBoxes).toBe(false);
    });
  });

  describe("World Updates", () => {
    it("should update selected entity when clicked", () => {
      const world = createWorld();
      const store = createDebugStore();
      const eid = addEntity(world);

      // Add Clickable component and set it as clicked
      Clickable.isClicked[eid] = 1;

      store.getState().update(world);
      expect(store.getState().selectedEntityId).toBe(eid);
    });

    it("should not update selected entity when nothing is clicked", () => {
      const world = createWorld();
      const store = createDebugStore();
      const eid = addEntity(world);

      // Add Clickable component but don't set it as clicked
      Clickable.isClicked[eid] = 0;

      store.getState().update(world);
      expect(store.getState().selectedEntityId).toBeNull();
    });
  });
});
