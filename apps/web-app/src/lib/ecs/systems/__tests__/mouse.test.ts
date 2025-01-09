import { addComponent, addEntity, createWorld } from "bitecs";
import { describe, expect, it } from "vitest";

import {
  Box,
  Camera,
  Circle,
  Clickable,
  CurrentPlayer,
  Debug,
  Hoverable,
  MouseState,
  Shape,
  Transform,
} from "../../components";
import { createMouseSystem } from "../mouse";

describe("Mouse System", () => {
  it("should transform mouse coordinates from screen to world space", () => {
    const world = createWorld();
    const mouseEid = addEntity(world);
    const cameraEid = addEntity(world);

    // Set up mouse entity
    addComponent(world, mouseEid, CurrentPlayer);
    addComponent(world, mouseEid, MouseState);
    MouseState.screenX[mouseEid] = 400; // Center of 800x600 canvas
    MouseState.screenY[mouseEid] = 300;

    // Set up camera entity
    addComponent(world, cameraEid, Camera);
    addComponent(world, cameraEid, Transform);
    Camera.isActive[cameraEid] = 1;
    Camera.zoom[cameraEid] = 2; // 2x zoom
    Transform.x[cameraEid] = 100; // Camera offset
    Transform.y[cameraEid] = 100;
    Transform.rotation[cameraEid] = 0;

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    const mouseSystem = createMouseSystem(canvas);
    mouseSystem(world);

    // With 2x zoom and camera at (100,100), center screen point should be at (100,100)
    expect(MouseState.worldX[mouseEid]).toBe(100);
    expect(MouseState.worldY[mouseEid]).toBe(100);
  });

  it("should detect hovering over box shapes", () => {
    const world = createWorld();
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
    addComponent(world, boxEid, Shape);
    addComponent(world, boxEid, Box);
    addComponent(world, boxEid, Hoverable);
    Transform.x[boxEid] = 0;
    Transform.y[boxEid] = 0;
    Box.width[boxEid] = 100;
    Box.height[boxEid] = 100;
    Shape.type[boxEid] = "box";

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    const mouseSystem = createMouseSystem(canvas);
    mouseSystem(world);

    // Mouse should be over the box
    expect(Hoverable.isHovered[boxEid]).toBe(1);
  });

  it("should detect hovering over circle shapes", () => {
    const world = createWorld();
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
    addComponent(world, circleEid, Shape);
    addComponent(world, circleEid, Circle);
    addComponent(world, circleEid, Hoverable);
    Transform.x[circleEid] = 0;
    Transform.y[circleEid] = 0;
    Circle.radius[circleEid] = 100;
    Shape.type[circleEid] = "circle";

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    const mouseSystem = createMouseSystem(canvas);
    mouseSystem(world);

    // Mouse should be over the circle
    expect(Hoverable.isHovered[circleEid]).toBe(1);
  });

  it("should handle mouse clicks on clickable entities", () => {
    const world = createWorld();
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
    addComponent(world, boxEid, Shape);
    addComponent(world, boxEid, Box);
    addComponent(world, boxEid, Clickable);
    Transform.x[boxEid] = 0;
    Transform.y[boxEid] = 0;
    Box.width[boxEid] = 100;
    Box.height[boxEid] = 100;
    Shape.type[boxEid] = "box";

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    const mouseSystem = createMouseSystem(canvas);
    mouseSystem(world);

    // Entity should be clicked
    expect(Clickable.isClicked[boxEid]).toBe(1);
  });

  it("should handle debug entities", () => {
    const world = createWorld();
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
    addComponent(world, debugEid, Shape);
    addComponent(world, debugEid, Box);
    addComponent(world, debugEid, Debug);
    Transform.x[debugEid] = 0;
    Transform.y[debugEid] = 0;
    Box.width[debugEid] = 100;
    Box.height[debugEid] = 100;
    Shape.type[debugEid] = "box";

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
});
