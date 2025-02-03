import { addEntity, createWorld } from 'bitecs'
import { describe, expect, it } from 'vitest'

import { Debug } from '../../components'
import type { WorldProps } from '../../types'
import { initialGameWorldState } from '../../world'
import { createDebug } from '../debug'

describe('Debug Entity', () => {
  it('should create a debug entity with default values', () => {
    const world = createWorld<WorldProps>(initialGameWorldState)
    const eid = addEntity(world)
    createDebug(world, eid)

    expect(Debug.hoveredEntity[eid]).toBe(0)
    expect(Debug.clickedEntity[eid]).toBe(0)
    expect(Debug.frameTime[eid]).toBe(0)
    expect(Debug.physicsTime[eid]).toBe(0)
    expect(Debug.renderTime[eid]).toBe(0)
    expect(Debug.updateTime[eid]).toBe(0)
    expect(Debug.lastUpdated[eid]).toBeGreaterThan(0)
    expect(Debug.logLevel[eid]).toBe(3) // Default to INFO level
    expect(Debug.isPaused[eid]).toBe(0)
    expect(Debug.stepFrame[eid]).toBe(0)
    expect(Debug.showBoundingBox[eid]).toBe(0)
    expect(Debug.showColliders[eid]).toBe(0)
    expect(Debug.showForceVectors[eid]).toBe(0)
    expect(Debug.showVelocityVector[eid]).toBe(0)
    expect(Debug.showOrigin[eid]).toBe(0)
    expect(Debug.showTriggerZones[eid]).toBe(0)
  })

  it('should create a debug entity with custom values', () => {
    const world = createWorld<WorldProps>(initialGameWorldState)
    const eid = addEntity(world)
    createDebug(world, eid, {
      logLevel: 4,
      showBoundingBox: true,
      showColliders: true,
      showForceVectors: true,
      showOrigin: true,
      showTriggerZones: true,
      showVelocityVector: true,
    })

    expect(Debug.hoveredEntity[eid]).toBe(0)
    expect(Debug.clickedEntity[eid]).toBe(0)
    expect(Debug.frameTime[eid]).toBe(0)
    expect(Debug.physicsTime[eid]).toBe(0)
    expect(Debug.renderTime[eid]).toBe(0)
    expect(Debug.updateTime[eid]).toBe(0)
    expect(Debug.lastUpdated[eid]).toBeGreaterThan(0)
    expect(Debug.logLevel[eid]).toBe(4)
    expect(Debug.isPaused[eid]).toBe(0)
    expect(Debug.stepFrame[eid]).toBe(0)
    expect(Debug.showBoundingBox[eid]).toBe(1)
    expect(Debug.showColliders[eid]).toBe(1)
    expect(Debug.showForceVectors[eid]).toBe(1)
    expect(Debug.showVelocityVector[eid]).toBe(1)
    expect(Debug.showOrigin[eid]).toBe(1)
    expect(Debug.showTriggerZones[eid]).toBe(1)
  })

  it('should update debug entity values', () => {
    const world = createWorld<WorldProps>(initialGameWorldState)
    const eid = addEntity(world)
    createDebug(world, eid)

    // Update values
    Debug.hoveredEntity[eid] = 1
    Debug.clickedEntity[eid] = 1
    Debug.frameTime[eid] = 16.67
    Debug.physicsTime[eid] = 5
    Debug.renderTime[eid] = 8
    Debug.updateTime[eid] = 3
    Debug.lastUpdated[eid] = 1000
    Debug.logLevel[eid] = 4
    Debug.isPaused[eid] = 1
    Debug.stepFrame[eid] = 1
    Debug.showBoundingBox[eid] = 1
    Debug.showColliders[eid] = 1
    Debug.showForceVectors[eid] = 1
    Debug.showVelocityVector[eid] = 1
    Debug.showOrigin[eid] = 1
    Debug.showTriggerZones[eid] = 1

    expect(Debug.hoveredEntity[eid]).toBe(1)
    expect(Debug.clickedEntity[eid]).toBe(1)
    expect(Debug.frameTime[eid]).toBe(16.67)
    expect(Debug.physicsTime[eid]).toBe(5)
    expect(Debug.renderTime[eid]).toBe(8)
    expect(Debug.updateTime[eid]).toBe(3)
    expect(Debug.lastUpdated[eid]).toBe(1000)
    expect(Debug.logLevel[eid]).toBe(4)
    expect(Debug.isPaused[eid]).toBe(1)
    expect(Debug.stepFrame[eid]).toBe(1)
    expect(Debug.showBoundingBox[eid]).toBe(1)
    expect(Debug.showColliders[eid]).toBe(1)
    expect(Debug.showForceVectors[eid]).toBe(1)
    expect(Debug.showVelocityVector[eid]).toBe(1)
    expect(Debug.showOrigin[eid]).toBe(1)
    expect(Debug.showTriggerZones[eid]).toBe(1)
  })
})
