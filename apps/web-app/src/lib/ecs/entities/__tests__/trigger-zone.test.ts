import { createWorld, query } from 'bitecs'
import { describe, expect, it } from 'vitest'

import {
  BoundingBox,
  Collidable,
  CollisionMask,
  Debug,
  Named,
  Transform,
  TriggerZone,
} from '../../components'
import type { WorldProps } from '../../types'
import { createTriggerZone } from '../trigger-zone'

describe('Trigger Zone Entity', () => {
  it('should create a trigger zone with all required components', () => {
    const world = createWorld<WorldProps>()
    const triggerEid = createTriggerZone(world, {
      actionId: 1,
      cooldown: 1000,
      height: 100,
      isRepeatable: true,
      type: 'battle',
      width: 100,
      x: 200,
      y: 150,
    })

    // Check if trigger zone entity has all required components
    const triggers = query(world, [
      Transform,
      BoundingBox,
      Collidable,
      TriggerZone,
      Named,
      Debug,
    ])
    expect(triggers).toContain(triggerEid)

    // Check transform values
    expect(Transform.x[triggerEid]).toBe(200)
    expect(Transform.y[triggerEid]).toBe(150)
    expect(Transform.rotation[triggerEid]).toBe(0)
    expect(Transform.scaleX[triggerEid]).toBe(1)
    expect(Transform.scaleY[triggerEid]).toBe(1)

    // Check bounding box values
    expect(BoundingBox.width[triggerEid]).toBe(100)
    expect(BoundingBox.height[triggerEid]).toBe(100)

    // Check collision values
    expect(Collidable.isActive[triggerEid]).toBe(1)
    expect(Collidable.isTrigger[triggerEid]).toBe(1)
    expect(Collidable.layer[triggerEid]).toBe(CollisionMask.Trigger)
    expect(Collidable.mask[triggerEid]).toBe(CollisionMask.Player)

    // Check trigger zone values
    expect(TriggerZone.actionId[triggerEid]).toBe(1)
    expect(TriggerZone.cooldown[triggerEid]).toBe(1000)
    expect(TriggerZone.isActivated[triggerEid]).toBe(0)
    expect(TriggerZone.isRepeatable[triggerEid]).toBe(1)
    expect(TriggerZone.lastActivatedTime[triggerEid]).toBe(0)
    expect(TriggerZone.type[triggerEid]).toBe('battle')

    // Check name
    expect(Named.name[triggerEid]).toBe('battle Trigger')
  })

  it('should create a non-repeatable trigger zone', () => {
    const world = createWorld<WorldProps>()
    const triggerEid = createTriggerZone(world, {
      actionId: 2,
      cooldown: 0,
      height: 50,
      isRepeatable: false,
      type: 'quest',
      width: 50,
      x: 0,
      y: 0,
    })

    expect(TriggerZone.isRepeatable[triggerEid]).toBe(0)
    expect(TriggerZone.cooldown[triggerEid]).toBe(0)
    expect(TriggerZone.type[triggerEid]).toBe('quest')
  })
})
