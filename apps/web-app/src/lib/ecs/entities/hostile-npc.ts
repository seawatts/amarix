import { IsA, addComponent, addEntity } from 'bitecs'

import {
  Acceleration,
  Clickable,
  Collidable,
  Force,
  Gravity,
  Health,
  HostileNPC,
  InteractionCooldown,
  NPC,
  NPCInteraction,
  Named,
  Polygon,
  RigidBody,
  SaveableMapEntity,
  Sound,
  Sprite,
  Style,
  Transform,
  Velocity,
} from '../components'
import type { World } from '../types'

// ... rest of imports ...

export function createHostileNPC(
  world: World,
  _options: CreateHostileNPCOptions,
) {
  const eid = addEntity(world)

  // Add NPC components
  addComponent(
    world,
    eid,
    Transform,
    NPC,
    HostileNPC,
    Health,
    Polygon,
    IsA(world.prefabs.shape),
    RigidBody,
    Collidable,
    Clickable,
    Sprite,
    Sound,
    Gravity,
    Acceleration,
    Velocity,
    Force,
    Named,
    Style,
    NPCInteraction,
    InteractionCooldown,
    SaveableMapEntity,
  )

  // Initialize SaveableMapEntity
  SaveableMapEntity.eid[eid] = eid

  // ... rest of the function ...
}
