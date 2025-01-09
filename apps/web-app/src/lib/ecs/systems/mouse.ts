import type { World } from "bitecs";
import { query } from "bitecs";

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
} from "../components";

function transformMouseToWorld(
  mouseX: number,
  mouseY: number,
  canvas: HTMLCanvasElement,
  cameraEid: number,
): { x: number; y: number } {
  // Get camera properties
  const cameraX = Transform.x[cameraEid] ?? 0;
  const cameraY = Transform.y[cameraEid] ?? 0;
  const cameraZoom = Camera.zoom[cameraEid] ?? 1;
  const cameraRotation = Transform.rotation[cameraEid] ?? 0;

  // 1. Translate to canvas center
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const dx = mouseX - centerX;
  const dy = mouseY - centerY;

  // 2. Unscale (divide by zoom)
  const unscaledX = dx / cameraZoom;
  const unscaledY = dy / cameraZoom;

  // 3. Unrotate
  const cos = Math.cos(-cameraRotation);
  const sin = Math.sin(-cameraRotation);
  const unrotatedX = unscaledX * cos - unscaledY * sin;
  const unrotatedY = unscaledX * sin + unscaledY * cos;

  // 4. Add camera position (since camera position is subtracted in rendering)
  return {
    x: unrotatedX + cameraX,
    y: unrotatedY + cameraY,
  };
}

function isPointInBox(
  mouseX: number,
  mouseY: number,
  entityX: number,
  entityY: number,
  width: number,
  height: number,
  rotation: number,
): boolean {
  // Translate point to origin
  const dx = mouseX - entityX;
  const dy = mouseY - entityY;

  // Rotate point around origin (inverse rotation)
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const rx = dx * cos - dy * sin;
  const ry = dx * sin + dy * cos;

  // Check if point is in axis-aligned box
  return (
    rx >= -width / 2 && rx <= width / 2 && ry >= -height / 2 && ry <= height / 2
  );
}

function isPointInCircle(
  mouseX: number,
  mouseY: number,
  entityX: number,
  entityY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): boolean {
  // Get distance from point to center
  const dx = mouseX - entityX;
  const dy = mouseY - entityY;
  const distance = Math.hypot(dx, dy);

  // Check if point is within radius
  if (distance > radius) return false;

  // If we have a full circle, we're done
  if (endAngle - startAngle >= Math.PI * 2) return true;

  // Otherwise, check if point is within arc
  const angle = Math.atan2(dy, dx);
  const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;
  return normalizedAngle >= startAngle && normalizedAngle <= endAngle;
}

function isPointInShape(
  mouseX: number,
  mouseY: number,
  eid: number,
  shapeType: string,
): boolean {
  const entityX = Transform.x[eid] ?? 0;
  const entityY = Transform.y[eid] ?? 0;

  switch (shapeType) {
    case "box": {
      const width = Box.width[eid] ?? 0;
      const height = Box.height[eid] ?? 0;
      const rotation = Transform.rotation[eid] ?? 0;
      return isPointInBox(
        mouseX,
        mouseY,
        entityX,
        entityY,
        width,
        height,
        rotation,
      );
    }
    case "circle": {
      const radius = Circle.radius[eid] ?? 0;
      const startAngle = Circle.startAngle[eid] ?? 0;
      const endAngle = Circle.endAngle[eid] ?? Math.PI * 2;
      return isPointInCircle(
        mouseX,
        mouseY,
        entityX,
        entityY,
        radius,
        startAngle,
        endAngle,
      );
    }
    default: {
      return false;
    }
  }
}

export function createMouseSystem(canvas: HTMLCanvasElement) {
  return function mouseSystem(world: World) {
    // Get current mouse position from MouseState
    const mouseEid = query(world, [CurrentPlayer, MouseState])[0];
    if (!mouseEid) return world;

    // Get active camera
    const cameras = query(world, [Camera, Transform]);
    const cameraEid = cameras.find((eid) => Camera.isActive[eid]);
    if (!cameraEid) return world;

    // Get screen space mouse coordinates
    const screenMouseX = MouseState.screenX[mouseEid] ?? 0;
    const screenMouseY = MouseState.screenY[mouseEid] ?? 0;

    // Transform to world space
    const { x: worldMouseX, y: worldMouseY } = transformMouseToWorld(
      screenMouseX,
      screenMouseY,
      canvas,
      cameraEid,
    );

    // Store world coordinates
    MouseState.worldX[mouseEid] = worldMouseX;
    MouseState.worldY[mouseEid] = worldMouseY;

    // Reset hover state
    MouseState.hoveredEntity[mouseEid] = 0;

    // Handle debug entities first
    const debugEntities = query(world, [Debug, Transform, Shape]);

    // Reset debug hover and click states
    for (const eid of debugEntities) {
      Debug.hoveredEntity[eid] = 0;
      Debug.clickedEntity[eid] = 0;
    }

    // Check for hover and clicks on debug entities
    for (const eid of debugEntities) {
      const shapeType = Shape.type[eid] ?? "";
      const isHovered = isPointInShape(
        worldMouseX,
        worldMouseY,
        eid,
        shapeType,
      );

      if (isHovered) {
        Debug.hoveredEntity[eid] = 1;
        MouseState.hoveredEntity[mouseEid] = eid;

        // Check for clicks
        const buttonsDown = MouseState.buttonsDown[mouseEid] ?? 0;
        if (buttonsDown > 0) {
          Debug.clickedEntity[eid] = 1;
          MouseState.clickedEntity[mouseEid] = eid;
        }
        break; // Only interact with one entity at a time
      }
    }

    // Now handle regular hoverable entities
    const hoverables = query(world, [Transform, Shape, Hoverable]);
    for (const eid of hoverables) {
      const shapeType = Shape.type[eid] ?? "";
      const isHovered = isPointInShape(
        worldMouseX,
        worldMouseY,
        eid,
        shapeType,
      );
      Hoverable.isHovered[eid] = isHovered ? 1 : 0;
    }

    // And handle regular clickable entities
    const clickables = query(world, [Transform, Shape, Clickable]);
    for (const eid of clickables) {
      const shapeType = Shape.type[eid] ?? "";
      const isClicked = isPointInShape(
        worldMouseX,
        worldMouseY,
        eid,
        shapeType,
      );
      const buttonsDown = MouseState.buttonsDown[mouseEid] ?? 0;
      Clickable.isClicked[eid] = isClicked && buttonsDown > 0 ? 1 : 0;
    }

    return world;
  };
}
