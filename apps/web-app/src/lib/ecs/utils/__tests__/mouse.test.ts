import {
  addComponent,
  addEntity,
  addPrefab,
  createEntityIndex,
  createWorld,
} from "bitecs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { WorldProps } from "../../types";
import { Camera, CurrentPlayer, MouseState, Transform } from "../../components";
import { createMouseSystem } from "../../systems/mouse";
import {
  clearMouseButtonDown,
  getCanvasCoordinates,
  getMouseState,
  isMouseButtonDown,
  MOUSE_BUTTONS,
  setClickedEntity,
  setHoveredEntity,
  setMouseButtonDown,
  updateMousePosition,
} from "../mouse";

describe("Mouse Utils", () => {
  let entityIndex: ReturnType<typeof createEntityIndex>;
  let world: ReturnType<typeof createWorld<WorldProps>>;
  let playerEid: number;

  beforeEach(() => {
    // Create a shared entity index for all worlds
    entityIndex = createEntityIndex();

    // Create world with the shared entity index
    world = createWorld<WorldProps>(entityIndex, {
      prefabs: {
        shape: 0,
      },
      timing: {
        delta: 16.67,
        lastFrame: 0,
      },
    });
    world.prefabs.shape = addPrefab(world);
    playerEid = addEntity(world);

    // Reset all MouseState arrays for this entity
    MouseState.buttonsDown[playerEid] = 0;
    MouseState.clickedEntity[playerEid] = 0;
    MouseState.hoveredEntity[playerEid] = 0;
    MouseState.screenX[playerEid] = 0;
    MouseState.screenY[playerEid] = 0;
    MouseState.worldX[playerEid] = 0;
    MouseState.worldY[playerEid] = 0;
  });

  afterEach(() => {
    // Clean up the world and reset components
    for (let index = 0; index < MouseState.buttonsDown.length; index++) {
      MouseState.buttonsDown[index] = 0;
      MouseState.clickedEntity[index] = 0;
      MouseState.hoveredEntity[index] = 0;
      MouseState.screenX[index] = 0;
      MouseState.screenY[index] = 0;
      MouseState.worldX[index] = 0;
      MouseState.worldY[index] = 0;
    }
  });

  describe("Canvas Coordinates", () => {
    it("should calculate canvas coordinates correctly", () => {
      const canvas = {
        getBoundingClientRect: () => ({
          height: 600,
          left: 100,
          top: 50,
          width: 800,
        }),
        height: 600,
        width: 800,
      } as HTMLCanvasElement;

      const event = {
        clientX: 300,
        clientY: 150,
      } as MouseEvent;

      const coords = getCanvasCoordinates(event, canvas);
      expect(coords).toEqual({ x: 200, y: 100 });
    });

    it("should handle scaled canvas", () => {
      const canvas = {
        getBoundingClientRect: () => ({
          // Canvas displayed at half size
          height: 300,

          left: 100,

          top: 50,
          width: 400,
        }),
        height: 600,
        width: 800,
      } as HTMLCanvasElement;

      const event = {
        clientX: 300,
        clientY: 150,
      } as MouseEvent;

      const coords = getCanvasCoordinates(event, canvas);
      expect(coords).toEqual({ x: 400, y: 200 }); // Coordinates scaled up
    });
  });

  describe("Mouse Button State", () => {
    it("should manage mouse button states correctly", () => {
      const world = createWorld<WorldProps>({
        prefabs: {
          shape: 0,
        },
        timing: {
          delta: 16.67,
          lastFrame: 0,
        },
      });
      world.prefabs.shape = addPrefab(world);
      const playerEid = addEntity(world);
      MouseState.buttonsDown[playerEid] = 0;

      // Initially no buttons are pressed
      expect(isMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT)).toBe(false);
      expect(isMouseButtonDown(playerEid, MOUSE_BUTTONS.RIGHT)).toBe(false);

      // Press left button
      setMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT);
      expect(isMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT)).toBe(true);
      expect(isMouseButtonDown(playerEid, MOUSE_BUTTONS.RIGHT)).toBe(false);

      // Press right button
      setMouseButtonDown(playerEid, MOUSE_BUTTONS.RIGHT);
      expect(isMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT)).toBe(true);
      expect(isMouseButtonDown(playerEid, MOUSE_BUTTONS.RIGHT)).toBe(true);

      // Clear left button
      clearMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT);
      expect(isMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT)).toBe(false);
      expect(isMouseButtonDown(playerEid, MOUSE_BUTTONS.RIGHT)).toBe(true);
    });
  });

  describe("Mouse Position", () => {
    it("should update mouse position correctly", () => {
      const world = createWorld<WorldProps>({
        prefabs: {
          shape: 0,
        },
        timing: {
          delta: 16.67,
          lastFrame: 0,
        },
      });
      world.prefabs.shape = addPrefab(world);
      const playerEid = addEntity(world);

      updateMousePosition(playerEid, 100, 200, 300, 400);

      expect(MouseState.screenX[playerEid]).toBe(100);
      expect(MouseState.screenY[playerEid]).toBe(200);
      expect(MouseState.worldX[playerEid]).toBe(300);
      expect(MouseState.worldY[playerEid]).toBe(400);
    });
  });

  describe("Entity Interaction", () => {
    it("should manage entity hover and click states", () => {
      const world = createWorld<WorldProps>({
        prefabs: {
          shape: 0,
        },
        timing: {
          delta: 16.67,
          lastFrame: 0,
        },
      });
      world.prefabs.shape = addPrefab(world);
      const playerEid = addEntity(world);
      const entityId = 42;

      setHoveredEntity(playerEid, entityId);
      expect(MouseState.hoveredEntity[playerEid]).toBe(entityId);

      setClickedEntity(playerEid, entityId);
      expect(MouseState.clickedEntity[playerEid]).toBe(entityId);
    });
  });

  describe("Mouse State", () => {
    it("should get complete mouse state", () => {
      // Setup initial state
      MouseState.buttonsDown[playerEid] = 0;
      updateMousePosition(playerEid, 100, 200, 300, 400);
      setHoveredEntity(playerEid, 42);
      setClickedEntity(playerEid, 43);
      setMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT);

      const state = getMouseState(playerEid);
      expect(state).toEqual({
        buttons: {
          left: true,
          middle: false,
          right: false,
        },
        clickedEntity: 43,
        hoveredEntity: 42,
        position: {
          screen: {
            x: 100,
            y: 200,
          },
          world: {
            x: 300,
            y: 400,
          },
        },
      });
    });

    it("should handle undefined state values", () => {
      // Reset the state to initial values
      MouseState.buttonsDown[playerEid] = 0;
      MouseState.clickedEntity[playerEid] = 0;
      MouseState.hoveredEntity[playerEid] = 0;
      MouseState.screenX[playerEid] = 0;
      MouseState.screenY[playerEid] = 0;
      MouseState.worldX[playerEid] = 0;
      MouseState.worldY[playerEid] = 0;

      const state = getMouseState(playerEid);
      expect(state).toEqual({
        buttons: {
          left: false,
          middle: false,
          right: false,
        },
        clickedEntity: 0,
        hoveredEntity: 0,
        position: {
          screen: {
            x: 0,
            y: 0,
          },
          world: {
            x: 0,
            y: 0,
          },
        },
      });
    });
  });
});

describe("Mouse Coordinate Transformations", () => {
  let entityIndex: ReturnType<typeof createEntityIndex>;
  let world: ReturnType<typeof createWorld<WorldProps>>;
  let mouseEid: number;
  let cameraEid: number;

  beforeEach(() => {
    // Create a shared entity index for all worlds
    entityIndex = createEntityIndex();

    // Create world with the shared entity index
    world = createWorld<WorldProps>(entityIndex, {
      prefabs: {
        shape: 0,
      },
      timing: {
        delta: 16.67,
        lastFrame: 0,
      },
    });
    world.prefabs.shape = addPrefab(world);
    mouseEid = addEntity(world);
    cameraEid = addEntity(world);

    // Reset all MouseState arrays for this entity
    MouseState.buttonsDown[mouseEid] = 0;
    MouseState.clickedEntity[mouseEid] = 0;
    MouseState.hoveredEntity[mouseEid] = 0;
    MouseState.screenX[mouseEid] = 0;
    MouseState.screenY[mouseEid] = 0;
    MouseState.worldX[mouseEid] = 0;
    MouseState.worldY[mouseEid] = 0;
  });

  afterEach(() => {
    // Clean up the world and reset components
    for (let index = 0; index < MouseState.buttonsDown.length; index++) {
      MouseState.buttonsDown[index] = 0;
      MouseState.clickedEntity[index] = 0;
      MouseState.hoveredEntity[index] = 0;
      MouseState.screenX[index] = 0;
      MouseState.screenY[index] = 0;
      MouseState.worldX[index] = 0;
      MouseState.worldY[index] = 0;
    }
  });

  it("should maintain stable world coordinates over multiple frames", () => {
    // Set up mouse entity
    addComponent(world, mouseEid, MouseState);
    addComponent(world, mouseEid, CurrentPlayer);
    MouseState.screenX[mouseEid] = 400; // Center of canvas
    MouseState.screenY[mouseEid] = 300;

    // Set up camera entity
    addComponent(world, cameraEid, Camera);
    addComponent(world, cameraEid, Transform);
    Camera.isActive[cameraEid] = 1;
    Camera.zoom[cameraEid] = 1;
    Transform.x[cameraEid] = 0;
    Transform.y[cameraEid] = 0;
    Transform.rotation[cameraEid] = 0;

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    const mouseSystem = createMouseSystem(canvas);

    // Track world coordinates over multiple frames
    const coordinates: { x: number; y: number }[] = [];

    // Run multiple frames
    for (let index = 0; index < 10; index++) {
      mouseSystem(world);
      coordinates.push({
        x: MouseState.worldX[mouseEid] ?? 0,
        y: MouseState.worldY[mouseEid] ?? 0,
      });
    }

    // Log all coordinates for debugging
    console.log("Mouse coordinates over frames:", coordinates);

    // Verify coordinates remain stable
    const initialX = coordinates[0]?.x ?? 0;
    const initialY = coordinates[0]?.y ?? 0;

    for (const coord of coordinates) {
      expect(coord.x).toBeCloseTo(initialX, 2);
      expect(coord.y).toBeCloseTo(initialY, 2);
    }
  });

  it("should correctly transform coordinates with different camera positions", () => {
    // Set up mouse entity
    addComponent(world, mouseEid, MouseState);
    addComponent(world, mouseEid, CurrentPlayer);
    MouseState.screenX[mouseEid] = 400; // Center of canvas
    MouseState.screenY[mouseEid] = 300;

    // Set up camera entity
    addComponent(world, cameraEid, Camera);
    addComponent(world, cameraEid, Transform);
    Camera.isActive[cameraEid] = 1;
    Camera.zoom[cameraEid] = 1;

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    const mouseSystem = createMouseSystem(canvas);

    // Test different camera positions
    const testPositions = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { x: -100, y: -100 },
      { x: 50, y: -50 },
    ];

    interface Result {
      camera: { x: number; y: number };
      world: { x: number; y: number };
    }

    const results: Result[] = [];

    for (const pos of testPositions) {
      Transform.x[cameraEid] = pos.x;
      Transform.y[cameraEid] = pos.y;

      mouseSystem(world);

      results.push({
        camera: { ...pos },
        world: {
          x: MouseState.worldX[mouseEid] ?? 0,
          y: MouseState.worldY[mouseEid] ?? 0,
        },
      });
    }

    // Log results for debugging
    console.log(
      "Coordinate transformations with different camera positions:",
      results,
    );

    // Verify relative positions are maintained
    const deltas = results
      .map((r, index) => {
        const previousResult = results[index - 1];
        if (!previousResult || index === 0) return null;

        return {
          dx: r.world.x - previousResult.world.x,
          dy: r.world.y - previousResult.world.y,
          expectedDx: r.camera.x - previousResult.camera.x,
          expectedDy: r.camera.y - previousResult.camera.y,
        };
      })
      .filter((delta): delta is NonNullable<typeof delta> => delta !== null);

    for (const delta of deltas) {
      expect(delta.dx).toBeCloseTo(delta.expectedDx, 2);
      expect(delta.dy).toBeCloseTo(delta.expectedDy, 2);
    }
  });
});
