import { IsA, addPrefab, createWorld, query } from 'bitecs'
import { describe, expect, it } from 'vitest'

import {
  Box,
  Collidable,
  CollisionMask,
  Debug,
  Named,
  RigidBody,
  Style,
  Transform,
} from '../../components'
import type { WorldProps } from '../../types'
import { initialGameWorldState } from '../../world'
import { createBox } from '../shapes'

describe('Shapes Entities', () => {
  describe('Box Entity', () => {
    it('should create a box with all required components', () => {
      const world = createWorld<WorldProps>(initialGameWorldState)
      world.prefabs.shape = addPrefab(world)
      world.prefabs.shape = addPrefab(world)
      const boxEid = createBox(world, {
        height: 100,
        width: 200,
        x: 300,
        y: 400,
      })

      // Check if box entity has all required components
      const boxes = query(world, [
        Transform,
        Box,
        IsA(world.prefabs.shape),
        Style,
        RigidBody,
        Collidable,
        Named,
        Debug,
      ])
      expect(boxes).toContain(boxEid)

      // Check transform values
      expect(Transform.x[boxEid]).toBe(300)
      expect(Transform.y[boxEid]).toBe(400)
      expect(Transform.rotation[boxEid]).toBe(0)
      expect(Transform.scaleX[boxEid]).toBe(1)
      expect(Transform.scaleY[boxEid]).toBe(1)

      // Check box values
      expect(Box.width[boxEid]).toBe(200)
      expect(Box.height[boxEid]).toBe(100)
      expect(Box.rotation[boxEid]).toBe(0)
      expect(Box.isWireframe[boxEid]).toBe(0)
      expect(Box.originX[boxEid]).toBe(0)
      expect(Box.originY[boxEid]).toBe(0)

      // Check style values
      expect(Style.fillColor[boxEid]).toBe('#ffffff')
      expect(Style.fillOpacity[boxEid]).toBe(1)
      expect(Style.strokeColor[boxEid]).toBe('#000000')
      expect(Style.strokeOpacity[boxEid]).toBe(1)
      expect(Style.strokeWidth[boxEid]).toBe(1)

      // Check physics values
      expect(RigidBody.mass[boxEid]).toBe(1)
      expect(RigidBody.friction[boxEid]).toBeCloseTo(0.2, 4)
      expect(RigidBody.restitution[boxEid]).toBeCloseTo(0.2, 4)
      expect(RigidBody.isStatic[boxEid]).toBe(0)

      // Check collision values
      expect(Collidable.isActive[boxEid]).toBe(1)
      expect(Collidable.isTrigger[boxEid]).toBe(0)
      expect(Collidable.layer[boxEid]).toBe(CollisionMask.Wall)
      expect(Collidable.mask[boxEid]).toBe(
        CollisionMask.Player | CollisionMask.NPC,
      )

      // Check name
      expect(Named.name[boxEid]).toBe('Box')
    })

    it('should create a static box', () => {
      const world = createWorld<WorldProps>(initialGameWorldState)
      world.prefabs.shape = addPrefab(world)
      const boxEid = createBox(world, {
        height: 100,
        isStatic: true,
        width: 200,
        x: 300,
        y: 400,
      })

      expect(RigidBody.mass[boxEid]).toBe(0)
      expect(RigidBody.isStatic[boxEid]).toBe(1)
    })

    it('should create a trigger box', () => {
      const world = createWorld<WorldProps>(initialGameWorldState)
      world.prefabs.shape = addPrefab(world)
      const boxEid = createBox(world, {
        height: 100,
        isTrigger: true,
        width: 200,
        x: 300,
        y: 400,
      })

      expect(Collidable.isTrigger[boxEid]).toBe(1)
    })

    it('should create a wireframe box', () => {
      const world = createWorld<WorldProps>(initialGameWorldState)
      world.prefabs.shape = addPrefab(world)
      const boxEid = createBox(world, {
        height: 100,
        isWireframe: true,
        width: 200,
        x: 300,
        y: 400,
      })

      expect(Box.isWireframe[boxEid]).toBe(1)
    })
  })
})
