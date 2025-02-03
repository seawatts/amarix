import { hasComponent, query } from 'bitecs'

import { Camera, GlobalMouseState, Transform } from '../components'
import type { World } from '../types'
import { isKeyDown } from '../utils/keyboard'

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

// Track gesture state
const gestureState = new Map<
  number,
  {
    isGesturing: boolean
    lastScale: number
    lastTranslationX: number
    lastTranslationY: number
  }
>()

export function createCameraSystem() {
  // Track the previous camera position for smoothing
  const previousPositions = new Map<number, { x: number; y: number }>()

  return function cameraSystem(world: World) {
    const cameras = query(world, [Camera, Transform])

    // Only process the first active camera
    for (const eid of cameras) {
      if (!Camera.isActive[eid]) continue

      // Get current camera position and zoom, defaulting if not set
      const currentX = Transform.x[eid] ?? 0
      const currentY = Transform.y[eid] ?? 0
      const currentZoom = Camera.zoom[eid] ?? 1

      // Initialize previous position if not set
      if (!previousPositions.has(eid)) {
        previousPositions.set(eid, { x: currentX, y: currentY })
      }

      // Initialize gesture state if not set
      if (!gestureState.has(eid)) {
        gestureState.set(eid, {
          isGesturing: false,
          lastScale: 1,
          lastTranslationX: 0,
          lastTranslationY: 0,
        })
      }

      let shouldFollowTarget = true
      let newX = currentX
      let newY = currentY
      let newZoom = currentZoom

      // Handle keyboard-based panning
      const isSpaceDown = isKeyDown('Space')
      const mouseX = GlobalMouseState.screenX
      const mouseY = GlobalMouseState.screenY

      if (isSpaceDown) {
        shouldFollowTarget = false
        if (Camera.isPanning[eid]) {
          // Continue panning - calculate delta from last position
          const deltaX = mouseX - (Camera.lastPanX[eid] ?? mouseX)
          const deltaY = mouseY - (Camera.lastPanY[eid] ?? mouseY)

          // Update camera position based on mouse movement
          // We divide by zoom to make the pan speed consistent at different zoom levels
          newX = currentX - deltaX / currentZoom
          newY = currentY - deltaY / currentZoom
        }

        // Update panning state
        Camera.isPanning[eid] = 1
        Camera.lastPanX[eid] = mouseX
        Camera.lastPanY[eid] = mouseY
      } else {
        // Stop panning
        Camera.isPanning[eid] = 0
      }

      // Handle touchpad gestures
      const state = gestureState.get(eid)
      if (state?.isGesturing) {
        shouldFollowTarget = false

        // Apply zoom changes
        if (state.lastScale !== 1) {
          // Clamp zoom between 0.1 and 10
          newZoom = Math.max(0.1, Math.min(10, currentZoom * state.lastScale))
        }

        // Apply pan changes
        if (state.lastTranslationX !== 0 || state.lastTranslationY !== 0) {
          newX = currentX - state.lastTranslationX / currentZoom
          newY = currentY - state.lastTranslationY / currentZoom
        }

        // Reset gesture state
        state.lastScale = 1
        state.lastTranslationX = 0
        state.lastTranslationY = 0
      }

      // Follow target if not panning or gesturing
      if (shouldFollowTarget) {
        const targetEntity = Camera.target[eid]
        if (
          targetEntity !== 0 &&
          typeof targetEntity === 'number' &&
          hasComponent(world, targetEntity, Transform)
        ) {
          const targetX = Transform.x[targetEntity] ?? 0
          const targetY = Transform.y[targetEntity] ?? 0
          const smoothing = Camera.smoothing[eid] ?? 0

          if (smoothing <= 0 || world.timing.delta <= 0) {
            // No smoothing or first frame, snap to target
            newX = targetX
            newY = targetY
          } else {
            // Apply smoothing
            const smoothFactor = Math.min(
              1,
              world.timing.delta / (smoothing * 1000),
            )
            const previousPos = previousPositions.get(eid)
            if (previousPos) {
              newX = lerp(previousPos.x, targetX, smoothFactor)
              newY = lerp(previousPos.y, targetY, smoothFactor)
            }
          }
        }
      }

      // Update camera position and zoom
      Transform.x[eid] = newX
      Transform.y[eid] = newY
      Camera.zoom[eid] = newZoom
      previousPositions.set(eid, { x: newX, y: newY })

      break // Only process first active camera
    }
  }
}

// Helper function to handle gesture start
export function handleGestureStart(eid: number) {
  const state = gestureState.get(eid)
  if (state) {
    state.isGesturing = true
  }
}

// Helper function to handle gesture end
export function handleGestureEnd(eid: number) {
  const state = gestureState.get(eid)
  if (state) {
    state.isGesturing = false
    state.lastScale = 1
    state.lastTranslationX = 0
    state.lastTranslationY = 0
  }
}

// Helper function to handle gesture update
export function handleGestureUpdate(
  eid: number,
  scale: number,
  translationX: number,
  translationY: number,
) {
  const state = gestureState.get(eid)
  if (state) {
    state.lastScale = scale
    state.lastTranslationX = translationX
    state.lastTranslationY = translationY
  }
}
