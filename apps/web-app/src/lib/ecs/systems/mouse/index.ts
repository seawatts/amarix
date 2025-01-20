import { hasComponent, IsA, query } from "bitecs";

import type { World } from "../../types";
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
import { isPointInBox, isPointInCircle, isPointInPolygon } from "./collision";
import { transformMouseToWorld } from "./transform";

interface MousePosition {
  worldX: number;
  worldY: number;
}

function getMousePosition(
  world: World,
  canvas: HTMLCanvasElement,
): MousePosition | null {
  const mouseEid = query(world, [CurrentPlayer, MouseState])[0];
  if (!mouseEid) return null;

  const cameras = query(world, [Camera, Transform]);
  const cameraEid = cameras.find((eid) => Camera.isActive[eid]);
  if (!cameraEid) return null;

  const screenMouseX = MouseState.screenX[mouseEid] ?? 0;
  const screenMouseY = MouseState.screenY[mouseEid] ?? 0;

  const { x: worldMouseX, y: worldMouseY } = transformMouseToWorld(
    screenMouseX,
    screenMouseY,
    canvas,
    cameraEid,
  );

  MouseState.worldX[mouseEid] = worldMouseX;
  MouseState.worldY[mouseEid] = worldMouseY;

  return { worldX: worldMouseX, worldY: worldMouseY };
}

function resetMouseState(world: World, mouseEid: number) {
  MouseState.hoveredEntity[mouseEid] = 0;
  MouseState.clickedEntity[mouseEid] = 0;

  const debugEntities = query(world, [
    Debug,
    Transform,
    IsA(world.prefabs.shape),
  ]);
  for (const eid of debugEntities) {
    Debug.hoveredEntity[eid] = 0;
    Debug.clickedEntity[eid] = 0;
  }

  const mouseStateEntities = query(world, [MouseState]);
  for (const eid of mouseStateEntities) {
    MouseState.hoveredEntity[eid] = 0;
    MouseState.clickedEntity[eid] = 0;
  }
}

function getPolygonPoints(eid: number): { x: number; y: number }[] | null {
  const points: { x: number; y: number }[] = [];
  const vertexCount = Polygon.vertexCount[eid] ?? 0;
  const verticesX = Polygon.verticesX[eid];
  const verticesY = Polygon.verticesY[eid];

  if (vertexCount === 0 || !verticesX || !verticesY) return null;

  for (let index = 0; index < vertexCount; index++) {
    const x = verticesX[index] ?? 0;
    const y = verticesY[index] ?? 0;
    points.push({ x, y });
  }

  return points;
}

function handleBoxShapes(
  world: World,
  mouseEid: number,
  mousePos: MousePosition,
) {
  const buttonsDown = MouseState.buttonsDown[mouseEid] ?? 0;
  const boxes = query(world, [Transform, Box, IsA(world.prefabs.shape)]);
  const debugEntities = query(world, [
    Debug,
    Transform,
    IsA(world.prefabs.shape),
  ]);

  for (const eid of new Set([...boxes, ...debugEntities])) {
    const width = Box.width[eid];
    const height = Box.height[eid];
    if (width === undefined || height === undefined) continue;

    const isInShape = isPointInBox(
      mousePos.worldX,
      mousePos.worldY,
      Transform.x[eid] ?? 0,
      Transform.y[eid] ?? 0,
      width,
      height,
      Transform.rotation[eid] ?? 0,
    );

    if (isInShape) {
      MouseState.hoveredEntity[mouseEid] = eid;

      if (buttonsDown > 0) {
        MouseState.clickedEntity[mouseEid] = eid;
      }
    }
    if (hasComponent(world, eid, Debug) && isInShape) {
      Debug.hoveredEntity[eid] = 1;

      if (buttonsDown > 0) {
        Debug.clickedEntity[eid] = 1;
        MouseState.clickedEntity[mouseEid] = eid;
      }
    }

    if (hasComponent(world, eid, Hoverable)) {
      Hoverable.isHovered[eid] = isInShape ? 1 : 0;
    }

    if (hasComponent(world, eid, Clickable)) {
      Clickable.isClicked[eid] = isInShape && buttonsDown > 0 ? 1 : 0;
    }
  }

  return false;
}

function handleCircleShapes(
  world: World,
  mouseEid: number,
  mousePos: MousePosition,
) {
  const buttonsDown = MouseState.buttonsDown[mouseEid] ?? 0;
  const circles = query(world, [Transform, Circle, IsA(world.prefabs.shape)]);
  const debugEntities = query(world, [
    Debug,
    Transform,
    IsA(world.prefabs.shape),
  ]);

  for (const eid of new Set([...circles, ...debugEntities])) {
    const radius = Circle.radius[eid];
    const startAngle = Circle.startAngle[eid];
    const endAngle = Circle.endAngle[eid];
    if (
      radius === undefined ||
      startAngle === undefined ||
      endAngle === undefined
    )
      continue;

    const isInShape = isPointInCircle(
      mousePos.worldX,
      mousePos.worldY,
      Transform.x[eid] ?? 0,
      Transform.y[eid] ?? 0,
      radius,
      startAngle,
      endAngle,
    );
    if (isInShape) {
      MouseState.hoveredEntity[mouseEid] = eid;

      if (buttonsDown > 0) {
        MouseState.clickedEntity[mouseEid] = eid;
      }
    }

    if (hasComponent(world, eid, Debug) && isInShape) {
      Debug.hoveredEntity[eid] = 1;

      if (buttonsDown > 0) {
        Debug.clickedEntity[eid] = 1;
      }
    }

    if (hasComponent(world, eid, Hoverable)) {
      Hoverable.isHovered[eid] = isInShape ? 1 : 0;
    }

    if (hasComponent(world, eid, Clickable)) {
      Clickable.isClicked[eid] = isInShape && buttonsDown > 0 ? 1 : 0;
    }
  }

  return false;
}

function handlePolygonShapes(
  world: World,
  mouseEid: number,
  mousePos: MousePosition,
) {
  const buttonsDown = MouseState.buttonsDown[mouseEid] ?? 0;
  const polygons = query(world, [Transform, Polygon, IsA(world.prefabs.shape)]);
  const debugEntities = query(world, [
    Debug,
    Transform,
    IsA(world.prefabs.shape),
  ]);

  for (const eid of new Set([...polygons, ...debugEntities])) {
    const points = getPolygonPoints(eid);
    if (!points) continue;

    const isInShape = isPointInPolygon(
      mousePos.worldX,
      mousePos.worldY,
      Transform.x[eid] ?? 0,
      Transform.y[eid] ?? 0,
      points,
      Transform.rotation[eid] ?? 0,
    );
    if (isInShape) {
      MouseState.hoveredEntity[mouseEid] = eid;
      if (buttonsDown > 0) {
        MouseState.clickedEntity[mouseEid] = eid;
      }
    }

    if (hasComponent(world, eid, Debug) && isInShape) {
      Debug.hoveredEntity[eid] = 1;

      if (buttonsDown > 0) {
        Debug.clickedEntity[eid] = 1;
      }
    }

    if (hasComponent(world, eid, Hoverable)) {
      Hoverable.isHovered[eid] = isInShape ? 1 : 0;
    }

    if (hasComponent(world, eid, Clickable)) {
      Clickable.isClicked[eid] = isInShape && buttonsDown > 0 ? 1 : 0;
    }
  }

  return false;
}

export function createMouseSystem(canvas: HTMLCanvasElement) {
  return function mouseSystem(world: World) {
    const mouseEid = query(world, [CurrentPlayer, MouseState])[0];
    if (!mouseEid) return;

    const mousePos = getMousePosition(world, canvas);
    if (!mousePos) return;

    resetMouseState(world, mouseEid);

    // If a debug shape is interacted with, skip other interactions
    handleBoxShapes(world, mouseEid, mousePos);
    handleCircleShapes(world, mouseEid, mousePos);
    handlePolygonShapes(world, mouseEid, mousePos);
  };
}
