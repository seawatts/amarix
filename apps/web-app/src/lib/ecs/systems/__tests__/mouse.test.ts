import {
  addComponent,
  addEntity,
  addPrefab,
  createEntityIndex,
  createWorld,
  IsA,
} from "bitecs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { WorldProps } from "../../types";
import {
  Box,
  Camera,
  Circle,
  Clickable,
  CurrentPlayer,
  Debug,
  Hoverable,
  MouseState,
  Polygon,
  Transform,
} from "../../components";
import { createMouseSystem } from "../mouse";

describe("Mouse System", () => {
  let entityIndex: ReturnType<typeof createEntityIndex>;
  let world: ReturnType<typeof createWorld<WorldProps>>;
  let mouseEid: number;
  let cameraEid: number;
  let canvas: HTMLCanvasElement;

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

    // Set up mouse entity
    addComponent(world, mouseEid, CurrentPlayer);
    addComponent(world, mouseEid, MouseState);
    MouseState.screenX[mouseEid] = 400; // Center of 800x600 canvas
    MouseState.screenY[mouseEid] = 300;

    // Set up camera entity
    addComponent(world, cameraEid, Camera);
    addComponent(world, cameraEid, Transform);
    Camera.isActive[cameraEid] = 1;
    Camera.zoom[cameraEid] = 1;
    Transform.x[cameraEid] = 0;
    Transform.y[cameraEid] = 0;
    Transform.rotation[cameraEid] = 0;

    // Set up canvas
    canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    // Reset all MouseState arrays for this entity
    MouseState.buttonsDown[mouseEid] = 0;
    MouseState.clickedEntity[mouseEid] = 0;
    MouseState.hoveredEntity[mouseEid] = 0;
    MouseState.screenX[mouseEid] = 400;
    MouseState.screenY[mouseEid] = 300;
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

  describe("Coordinate Transformation", () => {
    it("should correctly transform coordinates with no camera offset", () => {
      const mouseSystem = createMouseSystem(canvas);
      mouseSystem(world);

      // With no camera offset, center of screen should be (0,0) in world space
      expect(MouseState.worldX[mouseEid]).toBeCloseTo(0, 2);
      expect(MouseState.worldY[mouseEid]).toBeCloseTo(0, 2);
    });

    it("should correctly transform coordinates with camera offset", () => {
      Transform.x[cameraEid] = 100; // 100 pixels right
      Transform.y[cameraEid] = 50; // 50 pixels down

      const mouseSystem = createMouseSystem(canvas);
      mouseSystem(world);

      // Center of screen should be at camera position in world space
      expect(MouseState.worldX[mouseEid]).toBeCloseTo(100, 2);
      expect(MouseState.worldY[mouseEid]).toBeCloseTo(50, 2);
    });

    it("should correctly transform coordinates with camera zoom", () => {
      Camera.zoom[cameraEid] = 2; // 2x zoom

      const mouseSystem = createMouseSystem(canvas);
      mouseSystem(world);

      // With 2x zoom, center screen point should still be at origin
      expect(MouseState.worldX[mouseEid]).toBeCloseTo(0, 2);
      expect(MouseState.worldY[mouseEid]).toBeCloseTo(0, 2);

      // Test a point offset from center
      MouseState.screenX[mouseEid] = 600; // 200 pixels right of center
      MouseState.screenY[mouseEid] = 400; // 100 pixels down from center

      mouseSystem(world);

      // With 2x zoom, screen offset should be halved in world space
      expect(MouseState.worldX[mouseEid]).toBeCloseTo(100, 2);
      expect(MouseState.worldY[mouseEid]).toBeCloseTo(50, 2);
    });

    it("should correctly transform coordinates with camera rotation", () => {
      Transform.rotation[cameraEid] = Math.PI / 2; // 90 degrees clockwise

      const mouseSystem = createMouseSystem(canvas);
      mouseSystem(world);

      // Center point should still be at origin
      expect(MouseState.worldX[mouseEid]).toBeCloseTo(0, 2);
      expect(MouseState.worldY[mouseEid]).toBeCloseTo(0, 2);

      // Test a point offset from center
      MouseState.screenX[mouseEid] = 600; // 200 pixels right of center
      MouseState.screenY[mouseEid] = 300; // At vertical center

      mouseSystem(world);

      // With 90 degree rotation, right becomes down
      expect(MouseState.worldX[mouseEid]).toBeCloseTo(0, 2);
      expect(MouseState.worldY[mouseEid]).toBeCloseTo(200, 2);
    });

    it("should correctly transform coordinates with combined transformations", () => {
      // Set up complex camera transform
      Camera.zoom[cameraEid] = 2;
      Transform.rotation[cameraEid] = Math.PI / 4; // 45 degrees
      Transform.x[cameraEid] = 100;
      Transform.y[cameraEid] = 100;

      const mouseSystem = createMouseSystem(canvas);

      // Test center point
      mouseSystem(world);

      // Center should be at camera position
      expect(MouseState.worldX[mouseEid]).toBeCloseTo(100, 2);
      expect(MouseState.worldY[mouseEid]).toBeCloseTo(100, 2);

      // Test offset point
      MouseState.screenX[mouseEid] = 600; // 200 pixels right of center
      MouseState.screenY[mouseEid] = 300; // At vertical center

      mouseSystem(world);

      // With 2x zoom and 45 degree rotation, 200px right becomes (50√2, 50√2) in world space
      const expectedOffset = 100 / Math.sqrt(2);
      expect(MouseState.worldX[mouseEid]).toBeCloseTo(100 + expectedOffset, 2);
      expect(MouseState.worldY[mouseEid]).toBeCloseTo(100 + expectedOffset, 2);
    });
  });

  it("should detect hovering over box shapes", () => {
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
    const mouseEid = addEntity(world);
    const cameraEid = addEntity(world);
    const boxEid = addEntity(world);

    // Set up mouse entity
    addComponent(world, mouseEid, CurrentPlayer);
    addComponent(world, mouseEid, MouseState);
    MouseState.screenX[mouseEid] = 400;
    MouseState.screenY[mouseEid] = 300;

    // Set up camera entity
    addComponent(world, cameraEid, Camera);
    addComponent(world, cameraEid, Transform);
    Camera.isActive[cameraEid] = 1;
    Camera.zoom[cameraEid] = 1;
    Transform.x[cameraEid] = 0;
    Transform.y[cameraEid] = 0;

    // Set up box entity
    addComponent(world, boxEid, Transform);
    addComponent(world, boxEid, Box);
    addComponent(world, boxEid, Hoverable);
    addComponent(world, boxEid, IsA(world.prefabs.shape));
    Transform.x[boxEid] = 0;
    Transform.y[boxEid] = 0;
    Box.width[boxEid] = 100;
    Box.height[boxEid] = 100;

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    const mouseSystem = createMouseSystem(canvas);
    mouseSystem(world);

    // Mouse should be over the box
    expect(Hoverable.isHovered[boxEid]).toBe(1);
  });

  it("should detect hovering over circle shapes", () => {
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
    const mouseEid = addEntity(world);
    const cameraEid = addEntity(world);
    const circleEid = addEntity(world);

    // Set up mouse entity
    addComponent(world, mouseEid, CurrentPlayer);
    addComponent(world, mouseEid, MouseState);
    MouseState.screenX[mouseEid] = 400;
    MouseState.screenY[mouseEid] = 300;

    // Set up camera entity
    addComponent(world, cameraEid, Camera);
    addComponent(world, cameraEid, Transform);
    Camera.isActive[cameraEid] = 1;
    Camera.zoom[cameraEid] = 1;
    Transform.x[cameraEid] = 0;
    Transform.y[cameraEid] = 0;

    // Set up circle entity
    addComponent(world, circleEid, Transform);
    addComponent(world, circleEid, Circle);
    addComponent(world, circleEid, Hoverable);
    addComponent(world, circleEid, IsA(world.prefabs.shape));
    Transform.x[circleEid] = 0;
    Transform.y[circleEid] = 0;
    Circle.radius[circleEid] = 100;

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    const mouseSystem = createMouseSystem(canvas);
    mouseSystem(world);

    // Mouse should be over the circle
    expect(Hoverable.isHovered[circleEid]).toBe(1);
  });

  it("should handle mouse clicks on clickable entities", () => {
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
    const mouseEid = addEntity(world);
    const cameraEid = addEntity(world);
    const boxEid = addEntity(world);

    // Set up mouse entity
    addComponent(world, mouseEid, CurrentPlayer);
    addComponent(world, mouseEid, MouseState);
    MouseState.screenX[mouseEid] = 400;
    MouseState.screenY[mouseEid] = 300;
    MouseState.buttonsDown[mouseEid] = 1; // Left mouse button pressed

    // Set up camera entity
    addComponent(world, cameraEid, Camera);
    addComponent(world, cameraEid, Transform);
    Camera.isActive[cameraEid] = 1;
    Camera.zoom[cameraEid] = 1;
    Transform.x[cameraEid] = 0;
    Transform.y[cameraEid] = 0;

    // Set up clickable box entity
    addComponent(world, boxEid, Transform);
    addComponent(world, boxEid, Box);
    addComponent(world, boxEid, Clickable);
    addComponent(world, boxEid, IsA(world.prefabs.shape));
    Transform.x[boxEid] = 0;
    Transform.y[boxEid] = 0;
    Box.width[boxEid] = 100;
    Box.height[boxEid] = 100;

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    const mouseSystem = createMouseSystem(canvas);
    mouseSystem(world);

    // Entity should be clicked
    expect(Clickable.isClicked[boxEid]).toBe(1);
  });

  it("should handle debug entities", () => {
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
    const mouseEid = addEntity(world);
    const cameraEid = addEntity(world);
    const debugEid = addEntity(world);

    // Set up mouse entity
    addComponent(world, mouseEid, CurrentPlayer);
    addComponent(world, mouseEid, MouseState);
    MouseState.screenX[mouseEid] = 400;
    MouseState.screenY[mouseEid] = 300;
    MouseState.buttonsDown[mouseEid] = 1;

    // Set up camera entity
    addComponent(world, cameraEid, Camera);
    addComponent(world, cameraEid, Transform);
    Camera.isActive[cameraEid] = 1;
    Camera.zoom[cameraEid] = 1;
    Transform.x[cameraEid] = 0;
    Transform.y[cameraEid] = 0;

    // Set up debug entity
    addComponent(world, debugEid, Transform);
    addComponent(world, debugEid, Box);
    addComponent(world, debugEid, Debug);
    addComponent(world, debugEid, IsA(world.prefabs.shape));
    Transform.x[debugEid] = 0;
    Transform.y[debugEid] = 0;
    Box.width[debugEid] = 100;
    Box.height[debugEid] = 100;

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    const mouseSystem = createMouseSystem(canvas);
    mouseSystem(world);

    // Debug entity should be hovered and clicked
    expect(Debug.hoveredEntity[debugEid]).toBe(1);
    expect(Debug.clickedEntity[debugEid]).toBe(1);
    expect(MouseState.hoveredEntity[mouseEid]).toBe(debugEid);
    expect(MouseState.clickedEntity[mouseEid]).toBe(debugEid);
  });

  it("should detect hovering and clicking over polygon shapes", () => {
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
    const mouseEid = addEntity(world);
    const cameraEid = addEntity(world);
    const polygonEid = addEntity(world);

    // Set up mouse entity
    addComponent(world, mouseEid, CurrentPlayer);
    addComponent(world, mouseEid, MouseState);
    MouseState.screenX[mouseEid] = 400;
    MouseState.screenY[mouseEid] = 300;
    MouseState.buttonsDown[mouseEid] = 1; // Left mouse button pressed

    // Set up camera entity
    addComponent(world, cameraEid, Camera);
    addComponent(world, cameraEid, Transform);
    Camera.isActive[cameraEid] = 1;
    Camera.zoom[cameraEid] = 1;
    Transform.x[cameraEid] = 0;
    Transform.y[cameraEid] = 0;

    // Set up polygon entity
    addComponent(world, polygonEid, Transform);
    addComponent(world, polygonEid, Polygon);
    addComponent(world, polygonEid, Hoverable);
    addComponent(world, polygonEid, Clickable);
    addComponent(world, polygonEid, IsA(world.prefabs.shape));
    Transform.x[polygonEid] = 0;
    Transform.y[polygonEid] = 0;

    // Create a triangle shape
    Polygon.vertexCount[polygonEid] = 3;
    Polygon.verticesX[polygonEid] = new Float32Array([-50, 50, 0]);
    Polygon.verticesY[polygonEid] = new Float32Array([-50, -50, 50]);

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    const mouseSystem = createMouseSystem(canvas);
    mouseSystem(world);

    // Mouse should be over the polygon
    expect(Hoverable.isHovered[polygonEid]).toBe(1);
    expect(Clickable.isClicked[polygonEid]).toBe(1);
  });
});
