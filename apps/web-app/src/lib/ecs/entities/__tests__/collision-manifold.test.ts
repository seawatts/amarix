import { createWorld, query } from 'bitecs'
import { describe, expect, it } from 'vitest'

import { CollisionManifold, Named, Transform } from '../../components'
import type { WorldProps } from '../../types'
import { createCollisionManifold } from '../collision-manifold'

describe('Collision Manifold Entity', () => {
  it('should create a collision manifold with all required components', () => {
    const world = createWorld<WorldProps>()
    const manifoldEid = createCollisionManifold(world)

    // Check if collision manifold entity has all required components
    const manifolds = query(world, [CollisionManifold, Transform, Named])
    expect(manifolds).toContain(manifoldEid)

    // Check transform values
    expect(Transform.x[manifoldEid]).toBe(0)
    expect(Transform.y[manifoldEid]).toBe(0)
    expect(Transform.rotation[manifoldEid]).toBe(0)
    expect(Transform.scaleX[manifoldEid]).toBe(1)
    expect(Transform.scaleY[manifoldEid]).toBe(1)

    // Check name
    expect(Named.name[manifoldEid]).toBe('Collision Manifold')
  })
})
