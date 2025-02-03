import { addComponent, addEntity, createWorld } from 'bitecs'
import { describe, expect, it } from 'vitest'

import {
  CollisionManifold,
  InteractionCooldown,
  Movement,
  NPC,
  NPCInteraction,
  Player,
  Transform,
} from '../../components'
import type { WorldProps } from '../../types'
import { createNPCInteractionSystem } from '../npc-interaction'

describe.skip('NPC Interaction System', () => {
  it('should not process interactions during initial delay', () => {
    const world = createWorld<WorldProps>()
    const playerEid = addEntity(world)
    const npcEid = addEntity(world)
    const collisionEid = addEntity(world)

    // Set up player
    addComponent(world, playerEid, Player)
    addComponent(world, playerEid, Transform)
    addComponent(world, playerEid, Movement)

    // Set up NPC
    addComponent(world, npcEid, NPC)
    addComponent(world, npcEid, Transform)

    // Set up collision
    addComponent(world, collisionEid, CollisionManifold)
    CollisionManifold.entity1[collisionEid] = playerEid
    CollisionManifold.entity2[collisionEid] = npcEid

    const npcInteractionSystem = createNPCInteractionSystem()
    npcInteractionSystem(world)

    // No interaction should be created during initial delay
    expect(NPCInteraction._name in world).toBe(false)
  })

  it('should create interaction when player collides with NPC', async () => {
    const world = createWorld<WorldProps>()
    const playerEid = addEntity(world)
    const npcEid = addEntity(world)
    const collisionEid = addEntity(world)

    // Set up player
    addComponent(world, playerEid, Player)
    addComponent(world, playerEid, Transform)
    addComponent(world, playerEid, Movement)
    Movement.dx[playerEid] = 1
    Movement.dy[playerEid] = 1

    // Set up NPC
    addComponent(world, npcEid, NPC)
    addComponent(world, npcEid, Transform)

    // Set up collision
    addComponent(world, collisionEid, CollisionManifold)
    CollisionManifold.entity1[collisionEid] = playerEid
    CollisionManifold.entity2[collisionEid] = npcEid

    const npcInteractionSystem = createNPCInteractionSystem()

    // Wait for initial delay
    await new Promise((resolve) => setTimeout(resolve, 1100))

    // Add time to world for delta calculations
    const worldWithTime = {
      ...world,
      time: { delta: 0.016 }, // 60 FPS
    }

    npcInteractionSystem(worldWithTime)

    // Interaction should be created
    expect(NPCInteraction.message[npcEid]).toBe(
      'Hello traveler! How can I help you today?',
    )
    expect(InteractionCooldown.timer[npcEid]).toBeGreaterThan(0)

    // Player movement should be stopped
    expect(Movement.dx[playerEid]).toBe(0)
    expect(Movement.dy[playerEid]).toBe(0)
  })

  it('should remove interaction after cooldown', async () => {
    const world = createWorld<WorldProps>()
    const playerEid = addEntity(world)
    const npcEid = addEntity(world)
    const collisionEid = addEntity(world)

    // Set up player
    addComponent(world, playerEid, Player)
    addComponent(world, playerEid, Transform)
    addComponent(world, playerEid, Movement)

    // Set up NPC
    addComponent(world, npcEid, NPC)
    addComponent(world, npcEid, Transform)

    // Set up collision
    addComponent(world, collisionEid, CollisionManifold)
    CollisionManifold.entity1[collisionEid] = playerEid
    CollisionManifold.entity2[collisionEid] = npcEid

    const npcInteractionSystem = createNPCInteractionSystem()

    // Wait for initial delay
    await new Promise((resolve) => setTimeout(resolve, 1100))

    // Add time to world for delta calculations
    const worldWithTime = {
      ...world,
      time: { delta: 0.016 }, // 60 FPS
    }

    // Create interaction
    npcInteractionSystem(worldWithTime)

    // Fast forward through cooldown
    const worldWithLongDelta = {
      ...world,
      time: { delta: 1 }, // 1 second
    }

    npcInteractionSystem(worldWithLongDelta)

    // Interaction should be removed
    expect(NPCInteraction._name in world).toBe(false)
    expect(InteractionCooldown._name in world).toBe(false)
  })

  it('should not create interaction if NPC is already interacting', async () => {
    const world = createWorld<WorldProps>()
    const playerEid = addEntity(world)
    const npcEid = addEntity(world)
    const collisionEid = addEntity(world)

    // Set up player
    addComponent(world, playerEid, Player)
    addComponent(world, playerEid, Transform)
    addComponent(world, playerEid, Movement)

    // Set up NPC with existing interaction
    addComponent(world, npcEid, NPC)
    addComponent(world, npcEid, Transform)
    addComponent(world, npcEid, NPCInteraction)
    addComponent(world, npcEid, InteractionCooldown)
    NPCInteraction.message[npcEid] = 'Existing interaction'
    InteractionCooldown.timer[npcEid] = 0.5

    // Set up collision
    addComponent(world, collisionEid, CollisionManifold)
    CollisionManifold.entity1[collisionEid] = playerEid
    CollisionManifold.entity2[collisionEid] = npcEid

    const npcInteractionSystem = createNPCInteractionSystem()

    // Wait for initial delay
    await new Promise((resolve) => setTimeout(resolve, 1100))

    // Add time to world for delta calculations
    const worldWithTime = {
      ...world,
      time: { delta: 0.016 }, // 60 FPS
    }

    npcInteractionSystem(worldWithTime)

    // Message should not change
    expect(NPCInteraction.message[npcEid]).toBe('Existing interaction')
  })
})
