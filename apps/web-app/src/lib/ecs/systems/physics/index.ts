import { query, removeEntity } from 'bitecs'

import {
  CollisionManifold,
  Force,
  Gravity,
  Polygon,
  RigidBody,
  Transform,
  Velocity,
} from '../../components'
import { createCollisionManifold } from '../../entities/collision-manifold'
import type { World } from '../../types'

/* ----------------------------------------------------------------------------
 * 1) CONSTANTS
 * ----------------------------------------------------------------------------
 */
const FIXED_TIMESTEP = 1 / 60 // 60 Hz physics update
const MAX_TIMESTEP = 0.1 // clamp large dt
export const PIXELS_PER_METER = 247
const PENETRATION_CORRECTION_FACTOR = 0.8 // Correction factor for penetration (0.2-1.0)
const PENETRATION_ALLOWANCE = 0.01 * PIXELS_PER_METER // Small penetration allowed before correction
const BAUMGARTE_FACTOR = 0.2 // Baumgarte stabilization factor

/* ----------------------------------------------------------------------------
 * 2) 2D VECTOR & COLLISION UTILS
 * ----------------------------------------------------------------------------
 */

/** Normalize a 2D vector in place. */
function normalize(v: [number, number]) {
  const length = Math.hypot(v[0], v[1])
  if (length > 1e-6) {
    v[0] /= length
    v[1] /= length
  }
}

/** Return a perpendicular axis (dy, -dx) for edge p1->p2. */
function getEdgeNormal(
  p1: [number, number],
  p2: [number, number],
): [number, number] {
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]
  return [dy, -dx]
}

/** Project polygon onto axis => [min, max]. */
function projectVertices(
  verts: [number, number][],
  axis: [number, number],
): [number, number] {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  for (const [vx, vy] of verts) {
    const d = vx * axis[0] + vy * axis[1]
    if (d < min) min = d
    if (d > max) max = d
  }
  return [min, max]
}

/**
 * Convert local polygon coords to world-space.
 * If you want advanced rotation from RigidBody.rotation, apply it here as well.
 */
function getWorldVertices(_world: World, eid: number): [number, number][] {
  const px = Transform.x[eid] ?? 0
  const py = Transform.y[eid] ?? 0
  const count = Polygon.vertexCount[eid] ?? 0
  const xs = Polygon.verticesX[eid]
  const ys = Polygon.verticesY[eid]
  const localRot = Polygon.rotation[eid] ?? 0

  const cosr = Math.cos(localRot)
  const sinr = Math.sin(localRot)

  const result: [number, number][] = []
  for (let index = 0; index < count; index++) {
    const lx = xs?.[index] ?? 0
    const ly = ys?.[index] ?? 0

    // local polygon rotation
    const rx = lx * cosr - ly * sinr
    const ry = lx * sinr + ly * cosr

    // translate by world position
    result.push([px + rx, py + ry])
  }
  return result
}

/** SAT collision => { collided, overlap, overlapAxis }. */
function satCollision(
  vertsA: [number, number][],
  vertsB: [number, number][],
): { collided: boolean; overlap: number; overlapAxis: [number, number] } {
  const edges: [[number, number], [number, number]][] = []

  // Edges from A
  for (let index = 0; index < vertsA.length; index++) {
    const p1 = vertsA[index]
    const p2 = vertsA[(index + 1) % vertsA.length]
    if (p1 && p2) {
      edges.push([p1, p2])
    }
  }
  // Edges from B
  for (let index = 0; index < vertsB.length; index++) {
    const p1 = vertsB[index]
    const p2 = vertsB[(index + 1) % vertsB.length]
    if (p1 && p2) {
      edges.push([p1, p2])
    }
  }

  let minOverlap = Number.POSITIVE_INFINITY
  let overlapAxis: [number, number] = [0, 0]

  for (const [p1, p2] of edges) {
    const axis = getEdgeNormal(p1, p2)
    normalize(axis)

    const [minA, maxA] = projectVertices(vertsA, axis)
    const [minB, maxB] = projectVertices(vertsB, axis)

    if (maxA < minB || maxB < minA) {
      return { collided: false, overlap: 0, overlapAxis: [0, 0] }
    }

    const overlapDistribution = Math.min(maxA, maxB) - Math.max(minA, minB)
    if (overlapDistribution < minOverlap) {
      minOverlap = overlapDistribution
      overlapAxis = [axis[0], axis[1]]
    }
  }
  return { collided: true, overlap: minOverlap, overlapAxis }
}

/* ----------------------------------------------------------------------------
 * 3) GRAVITY SYSTEM
 * ----------------------------------------------------------------------------
 * Summation of gravity forces => Force.x, Force.y
 */
function applyGravitySystem(world: World) {
  const entities = query(world, [Gravity, RigidBody])

  for (const eid of entities) {
    if ((RigidBody.isStatic[eid] ?? 0) === 1) {
      // skip static bodies
      Force.x[eid] = 0
      Force.y[eid] = 0
      Force.torque[eid] = 0
      Velocity.x[eid] = 0
      Velocity.y[eid] = 0
      RigidBody.angularVelocity[eid] = 0
      continue
    }

    const gy = (Gravity.y[eid] ?? 0) * PIXELS_PER_METER // Scale gravity to pixels/s²
    const mass = RigidBody.mass[eid] ?? 1
    // F = m * g
    Force.y[eid] = (Force.y[eid] ?? 0) + mass * gy
  }
}

/* ----------------------------------------------------------------------------
 * 4) APPLY FORCES => VELOCITY
 * ----------------------------------------------------------------------------
 */
export function applyForcesSystem(world: World, dt: number) {
  const entities = query(world, [Force, RigidBody])

  for (const eid of entities) {
    if ((RigidBody.isStatic[eid] ?? 0) === 1) {
      Force.x[eid] = 0
      Force.y[eid] = 0
      Force.torque[eid] = 0
      Velocity.x[eid] = 0
      Velocity.y[eid] = 0
      RigidBody.angularVelocity[eid] = 0
      continue
    }

    const fx = Force.x[eid] ?? 0
    const fy = Force.y[eid] ?? 0
    const torque = Force.torque[eid] ?? 0

    const mass = Math.max(RigidBody.mass[eid] ?? 1, 0.0001)
    const moment = Math.max(RigidBody.momentOfInertia[eid] ?? 1, 0.0001)

    // v += (F / m) * dt
    Velocity.x[eid] = (Velocity.x[eid] ?? 0) + (fx / mass) * dt
    Velocity.y[eid] = (Velocity.y[eid] ?? 0) + (fy / mass) * dt

    // w += (torque / I) * dt
    RigidBody.angularVelocity[eid] =
      (RigidBody.angularVelocity[eid] ?? 0) + (torque / moment) * dt
    if (eid === 2) {
      // console.log(
      //   "fx",
      //   fx,
      //   "fy",
      //   fy,
      //   "torque",
      //   torque,
      //   "mass",
      //   mass,
      //   "moment",
      //   moment,
      //   "velocity",
      //   Velocity.x[eid],
      //   Velocity.y[eid],
      //   "angularVelocity",
      //   RigidBody.angularVelocity[eid],
      // );
    }

    // clear forces
    Force.x[eid] = 0
    Force.y[eid] = 0
    Force.torque[eid] = 0
  }
}

/* ----------------------------------------------------------------------------
 * 5) INTEGRATION SYSTEM
 * ----------------------------------------------------------------------------
 * Integrate velocity -> position, angularVelocity -> rotation,
 * handle friction, damping, etc.
 */
export function integrationSystem(world: World, dt: number) {
  const entities = query(world, [Transform, RigidBody, Velocity])

  for (const eid of entities) {
    if ((RigidBody.isStatic[eid] ?? 0) === 1) {
      Velocity.x[eid] = 0
      Velocity.y[eid] = 0
      RigidBody.angularVelocity[eid] = 0
      continue
    }

    let vx = Velocity.x[eid] ?? 0
    let vy = Velocity.y[eid] ?? 0
    let omega = RigidBody.angularVelocity[eid] ?? 0

    // Apply linear damping
    const linearDamping = RigidBody.linearDamping[eid] ?? 0
    if (linearDamping > 0) {
      const damping = (1 - linearDamping) ** dt
      vx *= damping
      vy *= damping
    }

    // Apply angular damping
    const angularDamping = RigidBody.angularDamping[eid] ?? 0
    if (angularDamping > 0) {
      const damping = (1 - angularDamping) ** dt
      omega *= damping
    }

    // Update position
    Transform.x[eid] = (Transform.x[eid] ?? 0) + vx * dt
    Transform.y[eid] = (Transform.y[eid] ?? 0) + vy * dt

    // Update rotation
    RigidBody.rotation[eid] = (RigidBody.rotation[eid] ?? 0) + omega * dt

    // Store updated velocities
    Velocity.x[eid] = vx
    Velocity.y[eid] = vy
    RigidBody.angularVelocity[eid] = omega
  }
}

/* ----------------------------------------------------------------------------
 * 6) COLLISION SYSTEM
 * ----------------------------------------------------------------------------
 */
export function collisionSystem(world: World) {
  const entities = query(world, [Transform, RigidBody, Polygon])

  // Clear old manifolds
  const oldManifolds = query(world, [CollisionManifold])
  for (const eid of oldManifolds) {
    removeEntity(world, eid)
  }

  // Check all pairs of entities for collisions
  for (let index = 0; index < entities.length; index++) {
    const eid1 = entities[index]
    if (!eid1) continue

    for (let index_ = index + 1; index_ < entities.length; index_++) {
      const eid2 = entities[index_]
      if (!eid2) continue

      // Skip if both bodies are static
      const isStatic1 = RigidBody.isStatic[eid1] ?? 0
      const isStatic2 = RigidBody.isStatic[eid2] ?? 0
      if (isStatic1 === 1 && isStatic2 === 1) {
        continue
      }

      // Get world-space vertices
      const vertsA = getWorldVertices(world, eid1)
      const vertsB = getWorldVertices(world, eid2)

      // Check for collision
      const { collided, overlap, overlapAxis } = satCollision(vertsA, vertsB)

      if (collided) {
        // Create collision manifold
        const manifoldEid = createCollisionManifold(world)
        if (!manifoldEid) continue

        CollisionManifold.entity1[manifoldEid] = eid1
        CollisionManifold.entity2[manifoldEid] = eid2
        CollisionManifold.penetrationDepth[manifoldEid] = overlap
        CollisionManifold.normalX[manifoldEid] = overlapAxis[0]
        CollisionManifold.normalY[manifoldEid] = overlapAxis[1]

        // Calculate relative velocity
        const v1x = Velocity.x[eid1] ?? 0
        const v1y = Velocity.y[eid1] ?? 0
        const v2x = Velocity.x[eid2] ?? 0
        const v2y = Velocity.y[eid2] ?? 0
        const relativeVx = v1x - v2x
        const relativeVy = v1y - v2y

        // Calculate restitution (coefficient of restitution)
        const restitution1 = RigidBody.restitution[eid1] ?? 0.5
        const restitution2 = RigidBody.restitution[eid2] ?? 0.5
        const restitution = Math.min(restitution1, restitution2)

        // Calculate impulse magnitude
        const relativeVelocityAlongNormal =
          relativeVx * overlapAxis[0] + relativeVy * overlapAxis[1]

        const mass1 = RigidBody.mass[eid1] ?? 1
        const mass2 = RigidBody.mass[eid2] ?? 1
        const inverseMassSum =
          (isStatic1 ? 0 : 1 / mass1) + (isStatic2 ? 0 : 1 / mass2)

        if (inverseMassSum > 0) {
          // Add Baumgarte stabilization impulse
          const penetrationError = Math.max(0, overlap - PENETRATION_ALLOWANCE)
          const baumgarteImpulse =
            (BAUMGARTE_FACTOR * penetrationError) / FIXED_TIMESTEP
          const velocityImpulse = relativeVelocityAlongNormal
          const totalImpulse =
            (-(1 + restitution) * (velocityImpulse + baumgarteImpulse)) /
            inverseMassSum

          // Apply impulses
          if (isStatic1 === 0) {
            const newVx1 = v1x + (totalImpulse / mass1) * overlapAxis[0]
            const newVy1 = v1y + (totalImpulse / mass1) * overlapAxis[1]
            Velocity.x[eid1] = newVx1
            Velocity.y[eid1] = newVy1

            // Position correction with stronger factor for static collisions
            const correctionFactor = isStatic2
              ? 1
              : PENETRATION_CORRECTION_FACTOR
            Transform.x[eid1] =
              (Transform.x[eid1] ?? 0) +
              overlapAxis[0] * overlap * correctionFactor
            Transform.y[eid1] =
              (Transform.y[eid1] ?? 0) +
              overlapAxis[1] * overlap * correctionFactor
          }

          if (isStatic2 === 0) {
            const newVx2 = v2x - (totalImpulse / mass2) * overlapAxis[0]
            const newVy2 = v2y - (totalImpulse / mass2) * overlapAxis[1]
            Velocity.x[eid2] = newVx2
            Velocity.y[eid2] = newVy2

            // Position correction with stronger factor for static collisions
            const correctionFactor = isStatic1
              ? 1
              : PENETRATION_CORRECTION_FACTOR
            Transform.x[eid2] =
              (Transform.x[eid2] ?? 0) -
              overlapAxis[0] * overlap * correctionFactor
            Transform.y[eid2] =
              (Transform.y[eid2] ?? 0) -
              overlapAxis[1] * overlap * correctionFactor
          }
        }
      }
    }
  }
}

export function createPhysicsSystem() {
  return function physicsSystem(world: World) {
    // clamp dt
    const clampedDt = Math.min(world.timing.delta, MAX_TIMESTEP)

    // subdivide
    const steps = Math.ceil(clampedDt / FIXED_TIMESTEP)
    const subDt = clampedDt / steps

    for (let index = 0; index < steps; index++) {
      // 1) Gravity
      applyGravitySystem(world)
      // 2) Forces => velocity
      applyForcesSystem(world, subDt)
      // 3) Integrate
      integrationSystem(world, subDt)
      // 4) Collisions (torque-based)
      collisionSystem(world)
    }
  }
}

/* ----------------------------------------------------------------------------
 * 8) RENDERING IN PIXELS
 * ----------------------------------------------------------------------------
 * Positions are in meters. For display:
 *   const xPx = (Position.x[eid] ?? 0) * PIXELS_PER_METER;
 *   const yPx = (Position.y[eid] ?? 0) * PIXELS_PER_METER;
 */
