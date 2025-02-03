import { addComponent } from 'bitecs'

import { Debug } from '../components'
import type { World } from '../types'

interface CreateDebugOptions {
  logLevel?: number
  showBoundingBox?: boolean
  showColliders?: boolean
  showForceVectors?: boolean
  showOrigin?: boolean
  showTriggerZones?: boolean
  showVelocityVector?: boolean
}

export function createDebug(
  world: World,
  eid: number,
  options?: CreateDebugOptions,
) {
  // Initialize all debug flags
  addComponent(world, eid, Debug)

  // Initialize debug flags
  Debug.hoveredEntity[eid] = 0
  Debug.clickedEntity[eid] = 0
  Debug.isSelected[eid] = 0
  Debug.showBoundingBox[eid] = Number(options?.showBoundingBox ?? false)
  Debug.showColliders[eid] = Number(options?.showColliders ?? false)
  Debug.showForceVectors[eid] = Number(options?.showForceVectors ?? false)
  Debug.showVelocityVector[eid] = Number(options?.showVelocityVector ?? false)
  Debug.showTriggerZones[eid] = Number(options?.showTriggerZones ?? false)
  Debug.showOrigin[eid] = Number(options?.showOrigin ?? false)

  // Set performance metrics
  Debug.frameTime[eid] = 0
  Debug.isPaused[eid] = 0
  Debug.lastUpdated[eid] = performance.now()
  Debug.logLevel[eid] = options?.logLevel ?? 3 // Default to INFO level
  Debug.physicsTime[eid] = 0
  Debug.renderTime[eid] = 0
  Debug.stepFrame[eid] = 0
  Debug.updateTime[eid] = 0

  // Initialize debug toString function
  Debug.toString[eid] = () => {
    const metrics = []
    const frameTime = Debug.frameTime[eid] ?? 0
    const physicsTime = Debug.physicsTime[eid] ?? 0
    const renderTime = Debug.renderTime[eid] ?? 0

    if (frameTime > 0) {
      metrics.push(`FPS: ${Math.round(1000 / frameTime)}`)
    }
    if (physicsTime > 0) {
      metrics.push(`Physics: ${Math.round(physicsTime)}ms`)
    }
    if (renderTime > 0) {
      metrics.push(`Render: ${Math.round(renderTime)}ms`)
    }
    return metrics.join(', ')
  }

  return eid
}
