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

export function createMouseSystem(canvas: HTMLCanvasElement) {
  // Cache queries that don't change often
  let debugEntities: number[] = [];
  let lastQueryTime = 0;
  const QUERY_CACHE_TIME = 1000; // Refresh cache every second

  return function mouseSystem(world: World) {
    const currentTime = performance.now();

    // Refresh entity cache periodically
    if (currentTime - lastQueryTime > QUERY_CACHE_TIME) {
      debugEntities = [
        ...query(world, [Debug, Transform, IsA(world.prefabs.shape)]),
      ];
      lastQueryTime = currentTime;
    }

    const mouseEid = query(world, [CurrentPlayer, MouseState])[0];
    if (!mouseEid) return;

    // Get mouse position in world space
    const mousePos = getMousePosition(world, canvas);
    if (!mousePos) return;

    // Reset state once at start of frame
    resetMouseState(world, mouseEid);

    // Get all interactive entities once
    const boxes = query(world, [Transform, Box, IsA(world.prefabs.shape)]);
    const circles = query(world, [Transform, Circle, IsA(world.prefabs.shape)]);
    const polygons = query(world, [
      Transform,
      Polygon,
      IsA(world.prefabs.shape),
    ]);

    const buttonsDown = MouseState.buttonsDown[mouseEid] ?? 0;

    // Process all shapes with a single iteration
    const allEntities = new Set([
      ...boxes,
      ...circles,
      ...polygons,
      ...debugEntities,
    ]);

    for (const eid of allEntities) {
      let isInShape = false;

      // Check box collision
      if (hasComponent(world, eid, Box)) {
        const width = Box.width[eid];
        const height = Box.height[eid];
        if (width !== undefined && height !== undefined) {
          isInShape = isPointInBox(
            mousePos.worldX,
            mousePos.worldY,
            Transform.x[eid] ?? 0,
            Transform.y[eid] ?? 0,
            width,
            height,
            Transform.rotation[eid] ?? 0,
          );
        }
      }

      // Check circle collision
      if (!isInShape && hasComponent(world, eid, Circle)) {
        const radius = Circle.radius[eid];
        const startAngle = Circle.startAngle[eid];
        const endAngle = Circle.endAngle[eid];
        if (
          radius !== undefined &&
          startAngle !== undefined &&
          endAngle !== undefined
        ) {
          isInShape = isPointInCircle(
            mousePos.worldX,
            mousePos.worldY,
            Transform.x[eid] ?? 0,
            Transform.y[eid] ?? 0,
            radius,
            startAngle,
            endAngle,
          );
        }
      }

      // Check polygon collision
      if (!isInShape && hasComponent(world, eid, Polygon)) {
        const points = getPolygonPoints(eid);
        if (points) {
          isInShape = isPointInPolygon(
            mousePos.worldX,
            mousePos.worldY,
            Transform.x[eid] ?? 0,
            Transform.y[eid] ?? 0,
            points,
            Transform.rotation[eid] ?? 0,
          );
        }
      }

      // Update entity state based on collision
      if (isInShape) {
        MouseState.hoveredEntity[mouseEid] = eid;
        if (buttonsDown > 0) {
          MouseState.clickedEntity[mouseEid] = eid;
        }

        if (hasComponent(world, eid, Debug)) {
          Debug.hoveredEntity[eid] = 1;
          if (buttonsDown > 0) {
            Debug.clickedEntity[eid] = 1;
          }
        }

        if (hasComponent(world, eid, Hoverable)) {
          Hoverable.isHovered[eid] = 1;
        }

        if (hasComponent(world, eid, Clickable) && buttonsDown > 0) {
          Clickable.isClicked[eid] = 1;
        }
      } else {
        if (hasComponent(world, eid, Hoverable)) {
          Hoverable.isHovered[eid] = 0;
        }
        if (hasComponent(world, eid, Clickable)) {
          Clickable.isClicked[eid] = 0;
        }
      }
    }
  };
}
