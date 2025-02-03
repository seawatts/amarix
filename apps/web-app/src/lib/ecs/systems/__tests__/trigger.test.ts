import { addComponent, addEntity, createWorld } from 'bitecs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  BoundingBox,
  Collidable,
  CurrentPlayer,
  Transform,
  TriggerZone,
} from '../../components'
import type { WorldProps } from '../../types'
import { createTriggerSystem } from '../trigger'

describe.skip('Trigger System', () => {
  beforeEach(() => {
    // Mock performance.now
    vi.spyOn(performance, 'now').mockReturnValue(1000)
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(vi.fn())
    vi.spyOn(console, 'warn').mockImplementation(vi.fn())
  })

  it('should activate trigger when player overlaps', () => {
    const world = createWorld<WorldProps>()
    const playerEid = addEntity(world)
    const triggerEid = addEntity(world)

    // Set up player
    addComponent(world, playerEid, CurrentPlayer)
    addComponent(world, playerEid, Transform)
    addComponent(world, playerEid, BoundingBox)
    Transform.x[playerEid] = 100
    Transform.y[playerEid] = 100
    BoundingBox.width[playerEid] = 50
    BoundingBox.height[playerEid] = 50

    // Set up trigger zone
    addComponent(world, triggerEid, Transform)
    addComponent(world, triggerEid, BoundingBox)
    addComponent(world, triggerEid, Collidable)
    addComponent(world, triggerEid, TriggerZone)
    Transform.x[triggerEid] = 100
    Transform.y[triggerEid] = 100
    BoundingBox.width[triggerEid] = 100
    BoundingBox.height[triggerEid] = 100
    Collidable.isTrigger[triggerEid] = 1
    TriggerZone.type[triggerEid] = 'quest'
    TriggerZone.actionId[triggerEid] = 1

    const triggerSystem = createTriggerSystem()
    triggerSystem(world)

    // Verify trigger was activated
    expect(TriggerZone.isActivated[triggerEid]).toBe(1)
    expect(TriggerZone.lastActivatedTime[triggerEid]).toBe(1000)
    expect(console.log).toHaveBeenCalledWith('Starting quest 1')
  })

  it('should not activate non-trigger colliders', () => {
    const world = createWorld<WorldProps>()
    const playerEid = addEntity(world)
    const triggerEid = addEntity(world)

    // Set up player
    addComponent(world, playerEid, CurrentPlayer)
    addComponent(world, playerEid, Transform)
    addComponent(world, playerEid, BoundingBox)
    Transform.x[playerEid] = 100
    Transform.y[playerEid] = 100
    BoundingBox.width[playerEid] = 50
    BoundingBox.height[playerEid] = 50

    // Set up non-trigger collider
    addComponent(world, triggerEid, Transform)
    addComponent(world, triggerEid, BoundingBox)
    addComponent(world, triggerEid, Collidable)
    addComponent(world, triggerEid, TriggerZone)
    Transform.x[triggerEid] = 100
    Transform.y[triggerEid] = 100
    BoundingBox.width[triggerEid] = 100
    BoundingBox.height[triggerEid] = 100
    Collidable.isTrigger[triggerEid] = 0 // Not a trigger
    TriggerZone.type[triggerEid] = 'quest'
    TriggerZone.actionId[triggerEid] = 1

    const triggerSystem = createTriggerSystem()
    triggerSystem(world)

    // Verify trigger was not activated
    expect(TriggerZone.isActivated[triggerEid]).toBeUndefined()
    expect(console.log).not.toHaveBeenCalled()
  })

  it('should respect repeatable triggers with cooldown', () => {
    const world = createWorld<WorldProps>()
    const playerEid = addEntity(world)
    const triggerEid = addEntity(world)

    // Set up player
    addComponent(world, playerEid, CurrentPlayer)
    addComponent(world, playerEid, Transform)
    addComponent(world, playerEid, BoundingBox)
    Transform.x[playerEid] = 100
    Transform.y[playerEid] = 100
    BoundingBox.width[playerEid] = 50
    BoundingBox.height[playerEid] = 50

    // Set up repeatable trigger
    addComponent(world, triggerEid, Transform)
    addComponent(world, triggerEid, BoundingBox)
    addComponent(world, triggerEid, Collidable)
    addComponent(world, triggerEid, TriggerZone)
    Transform.x[triggerEid] = 100
    Transform.y[triggerEid] = 100
    BoundingBox.width[triggerEid] = 100
    BoundingBox.height[triggerEid] = 100
    Collidable.isTrigger[triggerEid] = 1
    TriggerZone.type[triggerEid] = 'quest'
    TriggerZone.actionId[triggerEid] = 1
    TriggerZone.isRepeatable[triggerEid] = 1
    TriggerZone.cooldown[triggerEid] = 2000

    const triggerSystem = createTriggerSystem()

    // First activation
    triggerSystem(world)
    expect(TriggerZone.isActivated[triggerEid]).toBe(1)
    expect(console.log).toHaveBeenCalledTimes(1)

    // Try to activate again immediately (should be on cooldown)
    vi.clearAllMocks()
    triggerSystem(world)
    expect(console.log).not.toHaveBeenCalled()

    // Try after cooldown
    vi.clearAllMocks()
    vi.spyOn(performance, 'now').mockReturnValue(3500) // After 2.5s
    triggerSystem(world)
    expect(console.log).toHaveBeenCalledTimes(1)
  })

  it('should handle different trigger types', () => {
    const world = createWorld<WorldProps>()
    const playerEid = addEntity(world)
    const questTriggerEid = addEntity(world)
    const battleTriggerEid = addEntity(world)
    const dialogTriggerEid = addEntity(world)
    const checkpointTriggerEid = addEntity(world)

    // Set up player
    addComponent(world, playerEid, CurrentPlayer)
    addComponent(world, playerEid, Transform)
    addComponent(world, playerEid, BoundingBox)
    Transform.x[playerEid] = 100
    Transform.y[playerEid] = 100
    BoundingBox.width[playerEid] = 50
    BoundingBox.height[playerEid] = 50

    // Helper function to set up trigger
    function setupTrigger(eid: number, type: string, actionId: number) {
      addComponent(world, eid, Transform)
      addComponent(world, eid, BoundingBox)
      addComponent(world, eid, Collidable)
      addComponent(world, eid, TriggerZone)
      Transform.x[eid] = 100
      Transform.y[eid] = 100
      BoundingBox.width[eid] = 100
      BoundingBox.height[eid] = 100
      Collidable.isTrigger[eid] = 1
      TriggerZone.type[eid] = type
      TriggerZone.actionId[eid] = actionId
    }

    // Set up different trigger types
    setupTrigger(questTriggerEid, 'quest', 1)
    setupTrigger(battleTriggerEid, 'battle', 2)
    setupTrigger(dialogTriggerEid, 'dialog', 3)
    setupTrigger(checkpointTriggerEid, 'checkpoint', 4)

    const triggerSystem = createTriggerSystem()
    triggerSystem(world)

    // Verify each trigger type was handled correctly
    expect(console.log).toHaveBeenCalledWith('Starting quest 1')
    expect(console.log).toHaveBeenCalledWith('Starting battle 2')
    expect(console.log).toHaveBeenCalledWith('Starting dialog 3')
    expect(console.log).toHaveBeenCalledWith('Activating checkpoint 4')
  })

  it('should warn on unknown trigger type', () => {
    const world = createWorld<WorldProps>()
    const playerEid = addEntity(world)
    const triggerEid = addEntity(world)

    // Set up player
    addComponent(world, playerEid, CurrentPlayer)
    addComponent(world, playerEid, Transform)
    addComponent(world, playerEid, BoundingBox)
    Transform.x[playerEid] = 100
    Transform.y[playerEid] = 100
    BoundingBox.width[playerEid] = 50
    BoundingBox.height[playerEid] = 50

    // Set up trigger with unknown type
    addComponent(world, triggerEid, Transform)
    addComponent(world, triggerEid, BoundingBox)
    addComponent(world, triggerEid, Collidable)
    addComponent(world, triggerEid, TriggerZone)
    Transform.x[triggerEid] = 100
    Transform.y[triggerEid] = 100
    BoundingBox.width[triggerEid] = 100
    BoundingBox.height[triggerEid] = 100
    Collidable.isTrigger[triggerEid] = 1
    TriggerZone.type[triggerEid] = 'unknown'
    TriggerZone.actionId[triggerEid] = 1

    const triggerSystem = createTriggerSystem()
    triggerSystem(world)

    // Verify warning was logged
    expect(console.warn).toHaveBeenCalledWith('Unknown trigger type: unknown')
  })
})
