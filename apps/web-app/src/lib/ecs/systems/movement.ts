import { query } from 'bitecs'

import {
  Collidable,
  CollisionManifold,
  CollisionMask,
  Force,
  Player,
  RigidBody,
  Transform,
} from '../components'
import type { World } from '../types'
import { getMovementInput } from '../utils/keyboard'
import { PIXELS_PER_METER } from './physics'

// Constants based on player size (100 pixels) and physics scale
const BASE_MOVEMENT_FORCE = 50_000 // Base force in Newtons
const MOVEMENT_FORCE = BASE_MOVEMENT_FORCE * PIXELS_PER_METER // Scale force by pixel ratio
const MAX_SPEED = 1000 * PIXELS_PER_METER // 10 meters per second
const DAMPING = 0.95 // Smoother damping for more natural movement

// Jump constants
const JUMP_FORCE = 30_000 * PIXELS_PER_METER // Strong initial jump impulse
const MIN_JUMP_COOLDOWN = 0.1 // Minimum time between jumps in seconds

export const createMovementSystem = () => {
  // Track jump cooldown per entity
  const jumpCooldowns = new Map<number, number>()

  return function movementSystem(world: World) {
    const entities = query(world, [
      Transform,
      Force,
      RigidBody,
      Player,
      Collidable,
    ])

    // Get all collision manifolds
    const manifolds = query(world, [CollisionManifold])

    for (const eid of entities) {
      // Check if player is grounded by looking for collisions with walls
      let isGrounded = false
      for (const manifoldEid of manifolds) {
        const entity1 = CollisionManifold.entity1[manifoldEid] ?? 0
        const entity2 = CollisionManifold.entity2[manifoldEid] ?? 0

        // Skip if this manifold doesn't involve our entity
        if (entity1 !== eid && entity2 !== eid) continue

        // Get the other entity in the collision
        const otherEid = entity1 === eid ? entity2 : entity1

        // Check if we're colliding with a wall and the normal is pointing up
        const layer = Collidable.layer[otherEid]
        if (layer !== undefined && (layer & CollisionMask.Wall) !== 0) {
          const normalY = CollisionManifold.normalY[manifoldEid] ?? 0
          // If normal is pointing up (within a threshold), we're grounded
          if (normalY < -0.7) {
            isGrounded = true
            break
          }
        }
      }

      // Get movement input using helper function
      const { dx, dy } = getMovementInput()

      // Handle jumping
      const jumpCooldown = jumpCooldowns.get(eid) ?? 0
      const canJump = isGrounded && jumpCooldown <= 0

      if (dy < 0 && canJump) {
        // Negative dy means up movement (jump)
        // Apply a strong upward impulse
        Force.y[eid] = -JUMP_FORCE
        // Start jump cooldown
        jumpCooldowns.set(eid, MIN_JUMP_COOLDOWN)
      } else {
        // Update jump cooldown
        const delta = world.timing.delta
        if (jumpCooldown > 0) {
          jumpCooldowns.set(eid, jumpCooldown - delta)
        }

        // Handle horizontal movement
        if (dx === 0) {
          // Apply smoother damping when no input
          Force.x[eid] = (Force.x[eid] ?? 0) * DAMPING
        } else {
          // Apply horizontal movement force
          const mass = RigidBody.mass[eid] ?? 1
          const scaledForce = MOVEMENT_FORCE / PIXELS_PER_METER // Convert to world units
          Force.x[eid] = dx * scaledForce * mass
        }

        // Clamp horizontal force to prevent excessive speed
        const currentForce = Math.abs(Force.x[eid] ?? 0)
        if (currentForce > MAX_SPEED) {
          const scale = MAX_SPEED / currentForce
          Force.x[eid] = (Force.x[eid] ?? 0) * scale
        }
      }
    }
  }
}
