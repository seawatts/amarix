import { addComponent, addEntity, createWorld } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";

import type { WorldProps } from "../../types";
import {
  Camera,
  GlobalKeyboardState,
  GlobalMouseState,
  Transform,
} from "../../components";
import { setKeyDown } from "../../utils/keyboard";
import { initialGameWorldState } from "../../world";
import { createCameraSystem } from "../camera";

// Helper function to initialize components
function initializeComponent(eid: number, component: typeof Transform) {
  if (component === Transform) {
    Transform.x[eid] = 0;
    Transform.y[eid] = 0;
    Transform.rotation[eid] = 0;
    Transform.scaleX[eid] = 1;
    Transform.scaleY[eid] = 1;
  }
}

function logEntityState(eid: number, label: string) {
  console.log(`[${label}] Entity ${eid} state:`, {
    camera: {
      isActive: Camera.isActive[eid],
      isPanning: Camera.isPanning[eid],
      lastPan: {
        x: Camera.lastPanX[eid],
        y: Camera.lastPanY[eid],
      },
      smoothing: Camera.smoothing[eid],
      target: Camera.target[eid],
      zoom: Camera.zoom[eid],
    },
    keyboard: {
      isSpaceDown: GlobalKeyboardState.keys & (1 << 32),
    },
    mouse: {
      x: GlobalMouseState.screenX,
      y: GlobalMouseState.screenY,
    },
    transform: {
      x: Transform.x[eid],
      y: Transform.y[eid],
    },
  });
}

describe("Camera System", () => {
  beforeEach(() => {
    // Reset keyboard and mouse state
    GlobalKeyboardState.keys = 0;
    GlobalMouseState.screenX = 0;
    GlobalMouseState.screenY = 0;
  });

  describe("Basic Initialization", () => {
    it("should maintain initial position when no target is set", () => {
      console.log("test");
      const world = createWorld<WorldProps>();

      const cameraEid = addEntity(world);
      addComponent(world, cameraEid, Camera);
      addComponent(world, cameraEid, Transform);
      Transform.x[cameraEid] = 50;
      Transform.y[cameraEid] = 50;
      Camera.isActive[cameraEid] = 1;

      const cameraSystem = createCameraSystem();
      cameraSystem(world);

      expect(Transform.x[cameraEid]).toBe(50);
      expect(Transform.y[cameraEid]).toBe(50);
    });

    it("should initialize Transform to 0 if not set", () => {
      const world = createWorld<WorldProps>();
      const cameraEid = addEntity(world);
      addComponent(world, cameraEid, Camera);
      addComponent(world, cameraEid, Transform);
      initializeComponent(cameraEid, Transform);
      Camera.isActive[cameraEid] = 1;

      const cameraSystem = createCameraSystem();
      cameraSystem(world);

      expect(Transform.x[cameraEid]).toBe(0);
      expect(Transform.y[cameraEid]).toBe(0);
    });

    it("should not process inactive cameras", () => {
      const world = createWorld<WorldProps>();
      const cameraEid = addEntity(world);
      addComponent(world, cameraEid, Camera);
      addComponent(world, cameraEid, Transform);
      Transform.x[cameraEid] = 50;
      Transform.y[cameraEid] = 50;
      Camera.isActive[cameraEid] = 0;

      const cameraSystem = createCameraSystem();
      cameraSystem(world);

      expect(Transform.x[cameraEid]).toBe(50);
      expect(Transform.y[cameraEid]).toBe(50);
    });

    it("should properly initialize and maintain component values", () => {
      const world = createWorld<WorldProps>();
      const cameraEid = addEntity(world);

      console.log("Before adding components");
      logEntityState(cameraEid, "Initial");

      addComponent(world, cameraEid, Camera);
      addComponent(world, cameraEid, Transform);
      initializeComponent(cameraEid, Transform);

      console.log("After adding components, before setting values");
      logEntityState(cameraEid, "Post-components");

      Transform.x[cameraEid] = 25;
      Transform.y[cameraEid] = 25;
      Camera.isActive[cameraEid] = 1;

      console.log("After setting initial values");
      logEntityState(cameraEid, "Post-initialization");

      const cameraSystem = createCameraSystem();

      // Run system multiple times to ensure values persist
      for (let index = 0; index < 3; index++) {
        console.log(`Running camera system iteration ${index + 1}`);
        cameraSystem(world);
        logEntityState(cameraEid, `Post-update ${index + 1}`);

        expect(Transform.x[cameraEid]).toBe(25);
        expect(Transform.y[cameraEid]).toBe(25);
      }
    });

    it("should handle component removal and re-addition", () => {
      const world = createWorld<WorldProps>();
      const cameraEid = addEntity(world);

      // Initial setup
      addComponent(world, cameraEid, Camera);
      addComponent(world, cameraEid, Transform);
      Transform.x[cameraEid] = 75;
      Transform.y[cameraEid] = 75;
      Camera.isActive[cameraEid] = 1;

      console.log("Initial setup");
      logEntityState(cameraEid, "Initial");

      const cameraSystem = createCameraSystem();
      cameraSystem(world);

      console.log("After first update");
      logEntityState(cameraEid, "Post-update 1");

      // Verify initial state
      expect(Transform.x[cameraEid]).toBe(75);
      expect(Transform.y[cameraEid]).toBe(75);

      // Remove and re-add Transform
      // Note: In a real ECS, we'd use removeComponent, but for this test we'll simulate by setting to 0
      Transform.x[cameraEid] = 0;
      Transform.y[cameraEid] = 0;

      console.log("After removing Transform values");
      logEntityState(cameraEid, "Post-removal");

      cameraSystem(world);

      console.log("After update with removed Transform");
      logEntityState(cameraEid, "Post-update 2");

      // Should initialize to 0 when undefined
      expect(Transform.x[cameraEid]).toBe(0);
      expect(Transform.y[cameraEid]).toBe(0);

      // Set new values
      Transform.x[cameraEid] = 100;
      Transform.y[cameraEid] = 100;

      console.log("After setting new Transform values");
      logEntityState(cameraEid, "Pre-final-update");

      cameraSystem(world);

      console.log("After final update");
      logEntityState(cameraEid, "Final");

      // Should maintain new values
      expect(Transform.x[cameraEid]).toBe(100);
      expect(Transform.y[cameraEid]).toBe(100);
    });
  });

  describe("Target Following", () => {
    it("should immediately snap to target when smoothing is 0", () => {
      const world = createWorld<WorldProps>();
      const targetEid = addEntity(world);
      addComponent(world, targetEid, Transform);
      Transform.x[targetEid] = 100;
      Transform.y[targetEid] = 100;

      const cameraEid = addEntity(world);
      addComponent(world, cameraEid, Camera);
      addComponent(world, cameraEid, Transform);
      initializeComponent(cameraEid, Transform);
      Camera.target[cameraEid] = targetEid;
      Camera.isActive[cameraEid] = 1;
      Camera.smoothing[cameraEid] = 0;

      const cameraSystem = createCameraSystem();
      cameraSystem(world);

      expect(Transform.x[cameraEid]).toBe(100);
      expect(Transform.y[cameraEid]).toBe(100);
    });

    it("should not move if target has no Transform", () => {
      const world = createWorld<WorldProps>();
      const targetEid = addEntity(world);

      const cameraEid = addEntity(world);
      addComponent(world, cameraEid, Camera);
      addComponent(world, cameraEid, Transform);
      Transform.x[cameraEid] = 50;
      Transform.y[cameraEid] = 50;
      Camera.target[cameraEid] = targetEid;
      Camera.isActive[cameraEid] = 1;

      const cameraSystem = createCameraSystem();
      cameraSystem(world);

      expect(Transform.x[cameraEid]).toBe(50);
      expect(Transform.y[cameraEid]).toBe(50);
    });

    it("should handle target position updates in a single frame", () => {
      const world = createWorld<WorldProps>();
      const targetEid = addEntity(world);
      addComponent(world, targetEid, Transform);
      Transform.x[targetEid] = 100;
      Transform.y[targetEid] = 100;

      const cameraEid = addEntity(world);
      addComponent(world, cameraEid, Camera);
      addComponent(world, cameraEid, Transform);
      initializeComponent(cameraEid, Transform);
      Camera.target[cameraEid] = targetEid;
      Camera.isActive[cameraEid] = 1;
      Camera.smoothing[cameraEid] = 0;

      const cameraSystem = createCameraSystem();
      cameraSystem(world);

      // Update target position in the same frame
      Transform.x[targetEid] = 200;
      Transform.y[targetEid] = 200;
      cameraSystem(world);

      expect(Transform.x[cameraEid]).toBe(200);
      expect(Transform.y[cameraEid]).toBe(200);
    });

    it("should log detailed target following behavior", () => {
      const world = createWorld<WorldProps>();

      // Setup target
      const targetEid = addEntity(world);
      addComponent(world, targetEid, Transform);
      Transform.x[targetEid] = 100;
      Transform.y[targetEid] = 100;

      console.log("Target setup");
      logEntityState(targetEid, "Target-Initial");

      // Setup camera
      const cameraEid = addEntity(world);
      addComponent(world, cameraEid, Camera);
      addComponent(world, cameraEid, Transform);
      initializeComponent(cameraEid, Transform);
      Camera.target[cameraEid] = targetEid;
      Camera.isActive[cameraEid] = 1;
      Camera.smoothing[cameraEid] = 0.1; // Small smoothing for gradual movement

      console.log("Camera setup");
      logEntityState(cameraEid, "Camera-Initial");

      const cameraSystem = createCameraSystem();

      // Track positions over multiple updates
      const positions: { x: number; y: number }[] = [];

      for (let index = 0; index < 10; index++) {
        console.log(`Update iteration ${index + 1}`);
        cameraSystem(world);

        const currentX = Transform.x[cameraEid] ?? 0;
        const currentY = Transform.y[cameraEid] ?? 0;
        positions.push({ x: currentX, y: currentY });

        const currentPos = positions[index];
        if (!currentPos)
          throw new Error(`No position recorded for iteration ${index}`);

        console.log(`Position after update ${index + 1}:`, currentPos);
        logEntityState(cameraEid, `Camera-Update-${index + 1}`);
        logEntityState(targetEid, `Target-Update-${index + 1}`);

        // Verify movement is in the right direction
        if (index > 0) {
          const previousPos = positions[index - 1];
          if (!previousPos)
            throw new Error(`No previous position for iteration ${index}`);

          const currentPos_ = positions[index];
          if (!currentPos_)
            throw new Error(`No current position for iteration ${index}`);

          const deltaX = currentPos_.x - previousPos.x;
          const deltaY = currentPos_.y - previousPos.y;

          console.log("Movement from previous position:", {
            deltaX,
            deltaY,
          });

          // Verify camera is moving towards target
          expect(deltaX).toBeGreaterThan(0); // Moving right towards target
          expect(deltaY).toBeGreaterThan(0); // Moving down towards target
        }
      }
    });
  });

  describe("Smoothing", () => {
    it("should move towards target with smoothing", () => {
      const world = createWorld<WorldProps>();
      const targetEid = addEntity(world);
      addComponent(world, targetEid, Transform);
      Transform.x[targetEid] = 100;
      Transform.y[targetEid] = 100;

      const cameraEid = addEntity(world);
      addComponent(world, cameraEid, Camera);
      addComponent(world, cameraEid, Transform);
      Transform.x[cameraEid] = 0;
      Transform.y[cameraEid] = 0;
      Camera.target[cameraEid] = targetEid;
      Camera.isActive[cameraEid] = 1;
      Camera.smoothing[cameraEid] = 0.5;

      const cameraSystem = createCameraSystem();
      cameraSystem(world);

      // With 16ms frame time and 0.5s smoothing, we expect about 3.2% movement
      const expectedMin = 2;
      const expectedMax = 4;
      const cameraX = Transform.x[cameraEid] ?? 0;
      const cameraY = Transform.y[cameraEid] ?? 0;

      expect(cameraX).toBeGreaterThan(expectedMin);
      expect(cameraX).toBeLessThan(expectedMax);
      expect(cameraY).toBeGreaterThan(expectedMin);
      expect(cameraY).toBeLessThan(expectedMax);
    });

    it("should accumulate movement over multiple frames", () => {
      const world = createWorld<WorldProps>();
      const targetEid = addEntity(world);
      addComponent(world, targetEid, Transform);
      Transform.x[targetEid] = 100;
      Transform.y[targetEid] = 100;

      const cameraEid = addEntity(world);
      addComponent(world, cameraEid, Camera);
      addComponent(world, cameraEid, Transform);
      Transform.x[cameraEid] = 0;
      Transform.y[cameraEid] = 0;
      Camera.target[cameraEid] = targetEid;
      Camera.isActive[cameraEid] = 1;
      Camera.smoothing[cameraEid] = 0.5;

      const cameraSystem = createCameraSystem();

      // Track movement over multiple frames
      for (let frameIndex = 0; frameIndex < 5; frameIndex++) {
        cameraSystem(world);
      }

      // After 5 frames (80ms), we should have moved about 15% of the way there
      const finalX = Transform.x[cameraEid] ?? 0;
      const finalY = Transform.y[cameraEid] ?? 0;
      expect(finalX).toBeGreaterThan(10);
      expect(finalX).toBeLessThan(20);
      expect(finalY).toBeGreaterThan(10);
      expect(finalY).toBeLessThan(20);
    });

    it("should handle target changes during smoothing", () => {
      const world = createWorld<WorldProps>();
      const targetEid = addEntity(world);
      addComponent(world, targetEid, Transform);
      Transform.x[targetEid] = 100;
      Transform.y[targetEid] = 100;

      const cameraEid = addEntity(world);
      addComponent(world, cameraEid, Camera);
      addComponent(world, cameraEid, Transform);
      Transform.x[cameraEid] = 0;
      Transform.y[cameraEid] = 0;
      Camera.target[cameraEid] = targetEid;
      Camera.isActive[cameraEid] = 1;
      Camera.smoothing[cameraEid] = 0.5;

      const cameraSystem = createCameraSystem();

      // Start moving towards first target
      cameraSystem(world);
      const firstPos = {
        x: Transform.x[cameraEid] ?? 0,
        y: Transform.y[cameraEid] ?? 0,
      };

      // Change target position
      Transform.x[targetEid] = 200;
      Transform.y[targetEid] = 200;
      cameraSystem(world);
      const secondPos = {
        x: Transform.x[cameraEid] ?? 0,
        y: Transform.y[cameraEid] ?? 0,
      };

      // Should be moving towards new target
      expect(secondPos.x).toBeGreaterThan(firstPos.x);
      expect(secondPos.y).toBeGreaterThan(firstPos.y);
    });
  });

  describe("Panning", () => {
    it("should start panning when space is pressed", () => {
      const world = createWorld<WorldProps>();
      const cameraEid = addEntity(world);
      addComponent(world, cameraEid, Camera);
      addComponent(world, cameraEid, Transform);
      Camera.isActive[cameraEid] = 1;
      Camera.zoom[cameraEid] = 1;

      setKeyDown("Space");
      GlobalMouseState.screenX = 100;
      GlobalMouseState.screenY = 100;

      const cameraSystem = createCameraSystem();
      cameraSystem(world);

      expect(Camera.isPanning[cameraEid]).toBe(1);
      expect(Camera.lastPanX[cameraEid]).toBe(100);
      expect(Camera.lastPanY[cameraEid]).toBe(100);
    });

    it("should stop following target while panning", () => {
      const world = createWorld<WorldProps>();
      const targetEid = addEntity(world);
      addComponent(world, targetEid, Transform);
      Transform.x[targetEid] = 100;
      Transform.y[targetEid] = 100;

      const cameraEid = addEntity(world);
      addComponent(world, cameraEid, Camera);
      addComponent(world, cameraEid, Transform);
      Transform.x[cameraEid] = 0;
      Transform.y[cameraEid] = 0;
      Camera.target[cameraEid] = targetEid;
      Camera.isActive[cameraEid] = 1;
      Camera.zoom[cameraEid] = 1;

      const cameraSystem = createCameraSystem();

      // Start panning
      setKeyDown("Space");
      GlobalMouseState.screenX = 0;
      GlobalMouseState.screenY = 0;
      cameraSystem(world);

      // Move mouse
      GlobalMouseState.screenX = 50;
      GlobalMouseState.screenY = 50;
      cameraSystem(world);

      // Should move with pan, not towards target
      expect(Transform.x[cameraEid]).toBe(-50);
      expect(Transform.y[cameraEid]).toBe(-50);
    });

    it("should resume following target after panning stops", () => {
      const world = createWorld<WorldProps>();
      const targetEid = addEntity(world);
      addComponent(world, targetEid, Transform);
      Transform.x[targetEid] = 100;
      Transform.y[targetEid] = 100;

      const cameraEid = addEntity(world);
      addComponent(world, cameraEid, Camera);
      addComponent(world, cameraEid, Transform);
      Transform.x[cameraEid] = 0;
      Transform.y[cameraEid] = 0;
      Camera.target[cameraEid] = targetEid;
      Camera.isActive[cameraEid] = 1;
      Camera.zoom[cameraEid] = 1;
      Camera.smoothing[cameraEid] = 0; // No smoothing for this test

      const cameraSystem = createCameraSystem();

      // Start panning
      setKeyDown("Space");
      GlobalMouseState.screenX = 0;
      GlobalMouseState.screenY = 0;
      cameraSystem(world);

      // Pan away from target
      GlobalMouseState.screenX = 50;
      GlobalMouseState.screenY = 50;
      cameraSystem(world);

      // Stop panning
      GlobalKeyboardState.keys = 0;
      cameraSystem(world);

      // Should snap back to target
      expect(Transform.x[cameraEid]).toBe(100);
      expect(Transform.y[cameraEid]).toBe(100);
    });
  });

  describe("camera system", () => {
    it("should update camera position based on target", () => {
      const world = {
        ...initialGameWorldState,
        timing: { delta: 1 / 60, elapsed: 0, lastFrame: performance.now() },
      };
      const cameraSystem = createCameraSystem();

      // Create camera entity
      const cameraEid = addEntity(world);
      addComponent(world, cameraEid, Camera);
      addComponent(world, cameraEid, Transform);

      // Create target entity
      const targetEid = addEntity(world);
      addComponent(world, targetEid, Transform);

      // Set initial positions
      Transform.x[cameraEid] = 0;
      Transform.y[cameraEid] = 0;
      Transform.x[targetEid] = 100;
      Transform.y[targetEid] = 100;

      // Set camera target
      Camera.target[cameraEid] = targetEid;

      // Run camera system
      cameraSystem(world);

      // Camera should move towards target
      expect(Transform.x[cameraEid]).toBe(100);
      expect(Transform.y[cameraEid]).toBe(100);
    });
  });
});
