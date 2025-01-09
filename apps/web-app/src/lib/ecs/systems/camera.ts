import type { World } from "bitecs";
import { hasComponent, query } from "bitecs";

import { Camera, KeyboardState, MouseState, Transform } from "../components";

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function createCameraSystem() {
  // Track the previous camera position for smoothing
  const previousPositions = new Map<number, { x: number; y: number }>();

  return function cameraSystem(world: World, deltaTime: number): World {
    const cameras = query(world, [Camera, Transform]);

    // Only process the first active camera
    for (const eid of cameras) {
      if (!Camera.isActive[eid]) continue;

      // Get current camera position, defaulting to 0 if not set
      const currentX = Transform.x[eid] ?? 0;
      const currentY = Transform.y[eid] ?? 0;

      // Initialize previous position if not set
      if (!previousPositions.has(eid)) {
        previousPositions.set(eid, { x: currentX, y: currentY });
      }

      let shouldFollowTarget = true;
      let newX = currentX;
      let newY = currentY;

      // Handle panning if keyboard state exists
      if (KeyboardState.keys[eid] !== undefined) {
        const isSpaceDown = (KeyboardState.keys[eid] ?? 0) & (1 << 32); // Space key code
        const mouseX = MouseState.screenX[eid] ?? 0;
        const mouseY = MouseState.screenY[eid] ?? 0;

        if (isSpaceDown) {
          shouldFollowTarget = false;
          if (Camera.isPanning[eid]) {
            // Continue panning - calculate delta from last position
            const deltaX = mouseX - (Camera.lastPanX[eid] ?? mouseX);
            const deltaY = mouseY - (Camera.lastPanY[eid] ?? mouseY);

            // Update camera position based on mouse movement
            // We divide by zoom to make the pan speed consistent at different zoom levels
            const zoom = Camera.zoom[eid] ?? 1;
            newX = currentX - deltaX / zoom;
            newY = currentY - deltaY / zoom;
          }

          // Update panning state
          Camera.isPanning[eid] = 1;
          Camera.lastPanX[eid] = mouseX;
          Camera.lastPanY[eid] = mouseY;
        } else {
          // Stop panning
          Camera.isPanning[eid] = 0;
        }
      }

      // Follow target if not panning
      if (shouldFollowTarget) {
        const targetEntity = Camera.target[eid];
        if (
          targetEntity !== 0 &&
          typeof targetEntity === "number" &&
          hasComponent(world, targetEntity, Transform)
        ) {
          const targetX = Transform.x[targetEntity] ?? 0;
          const targetY = Transform.y[targetEntity] ?? 0;
          const smoothing = Camera.smoothing[eid] ?? 0;

          if (smoothing <= 0 || deltaTime <= 0) {
            // No smoothing or first frame, snap to target
            newX = targetX;
            newY = targetY;
          } else {
            // Apply smoothing
            const smoothFactor = Math.min(1, deltaTime / (smoothing * 1000));
            const previousPos = previousPositions.get(eid);
            if (previousPos) {
              newX = lerp(previousPos.x, targetX, smoothFactor);
              newY = lerp(previousPos.y, targetY, smoothFactor);
            }
          }
        }
      }

      // Update camera position
      Transform.x[eid] = newX;
      Transform.y[eid] = newY;
      previousPositions.set(eid, { x: newX, y: newY });

      break; // Only process first active camera
    }

    return world;
  };
}
