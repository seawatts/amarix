import { addEntity, createWorld } from 'bitecs'
import { describe, expect, it } from 'vitest'

import {
  BoundingBox,
  CurrentPlayer,
  Movement,
  Player,
  Transform,
  Velocity,
} from '../../components'
import type { WorldProps } from '../../types'
import { initialGameWorldState } from '../../world'
import { createPlayer } from '../player'

describe('Player Entity', () => {
  it('should create a player entity with default values', () => {
    const world = createWorld<WorldProps>(initialGameWorldState)
    const eid = addEntity(world)
    createPlayer(world, { x: 0, y: 0 })

    expect(Player.eid[eid]).toBe(eid)
    expect(CurrentPlayer.eid[eid]).toBe(eid)
    expect(Transform.x[eid]).toBe(0)
    expect(Transform.y[eid]).toBe(0)
    expect(Transform.rotation[eid]).toBe(0)
    expect(Transform.scaleX[eid]).toBe(1)
    expect(Transform.scaleY[eid]).toBe(1)
    expect(Velocity.x[eid]).toBe(0)
    expect(Velocity.y[eid]).toBe(0)
    expect(Movement.dx[eid]).toBe(0)
    expect(Movement.dy[eid]).toBe(0)
    expect(BoundingBox.width[eid]).toBe(32)
    expect(BoundingBox.height[eid]).toBe(32)
  })

  it('should create a player entity with custom position', () => {
    const world = createWorld<WorldProps>(initialGameWorldState)
    const eid = addEntity(world)
    createPlayer(world, { x: 100, y: 200 })

    expect(Player.eid[eid]).toBe(eid)
    expect(CurrentPlayer.eid[eid]).toBe(eid)
    expect(Transform.x[eid]).toBe(100)
    expect(Transform.y[eid]).toBe(200)
    expect(Transform.rotation[eid]).toBe(0)
    expect(Transform.scaleX[eid]).toBe(1)
    expect(Transform.scaleY[eid]).toBe(1)
    expect(Velocity.x[eid]).toBe(0)
    expect(Velocity.y[eid]).toBe(0)
    expect(Movement.dx[eid]).toBe(0)
    expect(Movement.dy[eid]).toBe(0)
    expect(BoundingBox.width[eid]).toBe(32)
    expect(BoundingBox.height[eid]).toBe(32)
  })
})
