import type { World } from "bitecs";
import { query } from "bitecs";

import { Camera, KeyboardState, MouseState, Transform } from "../components";

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function createCameraSystem() {
  // Track the previous camera position for smoothing
  const previousCameraPosition = {
    x: 0,
    y: 0,
  };

  return function cameraSystem(world: World, deltaTime: number): World {
    const cameras = query(world, [Camera]);
    console.log("cameras", cameras);
    // Only process the first active camera
    for (const eid of cameras) {
      console.log("camera isActivated", eid, Camera.isActive[eid]);
      if (!Camera.isActive[eid]) continue;

      // Check if space is held down (for camera panning)
      const isSpaceDown = (KeyboardState.keys[eid] ?? 0) & (1 << 32); // Space key code
      const mouseX = MouseState.x[eid] ?? 0;
      const mouseY = MouseState.y[eid] ?? 0;

      // Start panning if space is held
      if (isSpaceDown) {
        // console.log("spaceIsDown");
        if (Camera.isPanning[eid]) {
          // Continue panning - calculate delta from last position
          const deltaX = mouseX - (Camera.lastPanX[eid] ?? 0);
          const deltaY = mouseY - (Camera.lastPanY[eid] ?? 0);

          // Update camera position based on mouse movement
          // We divide by zoom to make the pan speed consistent at different zoom levels
          const zoom = Camera.zoom[eid] ?? 1;
          Transform.x[eid] = (Transform.x[eid] ?? 0) - deltaX / zoom;
          Transform.y[eid] = (Transform.y[eid] ?? 0) - deltaY / zoom;

          // Update last pan position
          Camera.lastPanX[eid] = mouseX;
          Camera.lastPanY[eid] = mouseY;
        } else {
          // Start panning
          Camera.isPanning[eid] = 1;
          Camera.lastPanX[eid] = mouseX;
          Camera.lastPanY[eid] = mouseY;
          // Clear target while panning
          Camera.target[eid] = 0;
        }
      } else {
        // Stop panning
        Camera.isPanning[eid] = 0;
      }

      // If not panning and has target, update position to follow target
      const targetEntity = Camera.target[eid];
      if (
        !Camera.isPanning[eid] &&
        targetEntity &&
        Transform.x[targetEntity] !== undefined
      ) {
        let targetX = Transform.x[targetEntity] ?? 0;
        let targetY = Transform.y[targetEntity] ?? 0;

        // Apply camera bounds
        targetX = clamp(targetX, Camera.minX[eid] ?? 0, Camera.maxX[eid] ?? 0);
        targetY = clamp(targetY, Camera.minY[eid] ?? 0, Camera.maxY[eid] ?? 0);

        // Apply smoothing if enabled
        const smoothing = Camera.smoothing[eid] ?? 0;
        if (smoothing > 0) {
          const smoothFactor = Math.min(1, deltaTime / (smoothing * 0.016)); // 60 FPS base
          Transform.x[eid] = lerp(
            previousCameraPosition.x,
            targetX,
            smoothFactor,
          );
          Transform.y[eid] = lerp(
            previousCameraPosition.y,
            targetY,
            smoothFactor,
          );
        } else {
          Transform.x[eid] = targetX;
          Transform.y[eid] = targetY;
        }

        // Store current position for next frame's smoothing
        previousCameraPosition.x = Transform.x[eid] ?? 0;
        previousCameraPosition.y = Transform.y[eid] ?? 0;
      }

      break; // Only process first active camera
    }

    return world;
  };
}
