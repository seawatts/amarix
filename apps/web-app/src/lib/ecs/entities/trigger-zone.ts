import { IsA, addComponent, addEntity } from 'bitecs'

import {
  BoundingBox,
  Clickable,
  Collidable,
  CollisionMask,
  Named,
  Polygon,
  RigidBody,
  SaveableMapEntity,
  Style,
  Transform,
  TriggerZone,
} from '../components'
import type { World } from '../types'
import { createDebug } from './debug'

interface CreateTriggerZoneOptions {
  actionId: number
  cooldown: number
  height: number
  isRepeatable: boolean
  type: 'battle' | 'quest' | 'scene'
  width: number
  x: number
  y: number
}

export function createTriggerZone(
  world: World,
  options: CreateTriggerZoneOptions,
) {
  const eid = addEntity(world)

  // Add trigger zone components
  addComponent(
    world,
    eid,
    Transform,
    BoundingBox,
    Polygon,
    IsA(world.prefabs.shape),
    RigidBody,
    Collidable,
    Clickable,
    Named,
    Style,
    TriggerZone,
    SaveableMapEntity,
  )

  // Initialize SaveableMapEntity
  SaveableMapEntity.eid[eid] = eid

  // Set trigger zone values
  Transform.x[eid] = options.x
  Transform.y[eid] = options.y
  Transform.rotation[eid] = 0
  Transform.scaleX[eid] = 1
  Transform.scaleY[eid] = 1

  // Set bounding box size
  BoundingBox.width[eid] = options.width
  BoundingBox.height[eid] = options.height

  // Set trigger zone values
  TriggerZone.actionId[eid] = options.actionId
  TriggerZone.cooldown[eid] = options.cooldown
  TriggerZone.isRepeatable[eid] = options.isRepeatable ? 1 : 0
  TriggerZone.type[eid] = options.type

  // Set collision values
  Collidable.isActive[eid] = 1
  Collidable.isTrigger[eid] = 1
  Collidable.layer[eid] = CollisionMask.Trigger
  Collidable.mask[eid] = CollisionMask.Player

  // Set name
  Named.name[eid] = `Trigger Zone (${options.type})`

  // Set style
  Style.strokeColor[eid] = '#00ff00'
  Style.strokeWidth[eid] = 2
  Style.fillOpacity[eid] = 0.2

  createDebug(world, eid)

  return eid
}
