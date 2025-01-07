import type { World } from "bitecs";
import { hasComponent, query, removeComponent, removeEntity } from "bitecs";

import {
  CollisionManifold,
  Force,
  Gravity,
  Polygon,
  RigidBody,
  Transform,
  Velocity,
} from "../../components";
import { createCollisionManifold } from "../../entities/collision-manifold";

/* ----------------------------------------------------------------------------
 * 1) CONSTANTS
 * ----------------------------------------------------------------------------
 */
const FIXED_TIMESTEP = 1 / 60; // 60 Hz physics update
const MAX_TIMESTEP = 0.1; // clamp large dt
export const PIXELS_PER_METER = 247;

/* ----------------------------------------------------------------------------
 * 2) 2D VECTOR & COLLISION UTILS (Including Torque Helpers)
 * ----------------------------------------------------------------------------
 */

/** Dot product in 2D. */
function dot(a: [number, number], b: [number, number]) {
  return a[0] * b[0] + a[1] * b[1];
}

/** Cross product in 2D (returns scalar). */
function cross2D(a: [number, number], b: [number, number]): number {
  return a[0] * b[1] - a[1] * b[0];
}

/** Cross of scalar with vector => rotate vector by 90 deg * scalar. */
function crossScalarVector(
  omega: number,
  v: [number, number],
): [number, number] {
  // (omega × [vx, vy]) = [-omega*vy, omega*vx]
  return [-omega * v[1], omega * v[0]];
}

/** Normalize a 2D vector in place. */
function normalize(v: [number, number]) {
  const length = Math.hypot(v[0], v[1]);
  if (length > 1e-6) {
    v[0] /= length;
    v[1] /= length;
  }
}

/** Return a perpendicular axis (dy, -dx) for edge p1->p2. */
function getEdgeNormal(
  p1: [number, number],
  p2: [number, number],
): [number, number] {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return [dy, -dx];
}

/** Project polygon onto axis => [min, max]. */
function projectVertices(
  verts: [number, number][],
  axis: [number, number],
): [number, number] {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const [vx, vy] of verts) {
    const d = vx * axis[0] + vy * axis[1];
    if (d < min) min = d;
    if (d > max) max = d;
  }
  return [min, max];
}

/** Approx centroid of a polygon. */
function centroid(verts: [number, number][]): [number, number] {
  let sumX = 0;
  let sumY = 0;
  for (const [x, y] of verts) {
    sumX += x;
    sumY += y;
  }
  const n = verts.length || 1;
  return [sumX / n, sumY / n];
}

/**
 * Convert local polygon coords to world-space.
 * If you want advanced rotation from RigidBody.rotation, apply it here as well.
 */
function getWorldVertices(world: World, eid: number): [number, number][] {
  const px = Transform.x[eid] ?? 0;
  const py = Transform.y[eid] ?? 0;
  const count = Polygon.vertexCount[eid] ?? 0;
  const xs = Polygon.verticesX[eid];
  const ys = Polygon.verticesY[eid];
  const localRot = Polygon.rotation[eid] ?? 0;

  const cosr = Math.cos(localRot);
  const sinr = Math.sin(localRot);

  const result: [number, number][] = [];
  for (let index = 0; index < count; index++) {
    const lx = xs?.[index] ?? 0;
    const ly = ys?.[index] ?? 0;

    // local polygon rotation
    const rx = lx * cosr - ly * sinr;
    const ry = lx * sinr + ly * cosr;

    // translate by world position
    result.push([px + rx, py + ry]);
  }
  return result;
}

/** SAT collision => { collided, overlap, overlapAxis }. */
function satCollision(
  vertsA: [number, number][],
  vertsB: [number, number][],
): { collided: boolean; overlap: number; overlapAxis: [number, number] } {
  const edges: [[number, number], [number, number]][] = [];

  // Edges from A
  for (let index = 0; index < vertsA.length; index++) {
    const p1 = vertsA[index];
    const p2 = vertsA[(index + 1) % vertsA.length];
    if (p1 && p2) {
      edges.push([p1, p2]);
    }
  }
  // Edges from B
  for (let index = 0; index < vertsB.length; index++) {
    const p1 = vertsB[index];
    const p2 = vertsB[(index + 1) % vertsB.length];
    if (p1 && p2) {
      edges.push([p1, p2]);
    }
  }

  let minOverlap = Number.POSITIVE_INFINITY;
  let overlapAxis: [number, number] = [0, 0];

  for (const [p1, p2] of edges) {
    const axis = getEdgeNormal(p1, p2);
    normalize(axis);

    const [minA, maxA] = projectVertices(vertsA, axis);
    const [minB, maxB] = projectVertices(vertsB, axis);

    if (maxA < minB || maxB < minA) {
      return { collided: false, overlap: 0, overlapAxis: [0, 0] };
    }

    const overlapDistribution = Math.min(maxA, maxB) - Math.max(minA, minB);
    if (overlapDistribution < minOverlap) {
      minOverlap = overlapDistribution;
      overlapAxis = [axis[0], axis[1]];
    }
  }
  return { collided: true, overlap: minOverlap, overlapAxis };
}

/* ----------------------------------------------------------------------------
 * 3) GRAVITY SYSTEM
 * ----------------------------------------------------------------------------
 * Summation of gravity forces => Force.x, Force.y
 */
function applyGravitySystem(world: World) {
  const entities = query(world, [Gravity, RigidBody]);

  for (const eid of entities) {
    if ((RigidBody.isStatic[eid] ?? 0) === 1) {
      // skip static bodies
      Force.x[eid] = 0;
      Force.y[eid] = 0;
      Force.torque[eid] = 0;
      continue;
    }

    const gy = Gravity.y[eid] ?? 0; // e.g. 9.81
    const mass = RigidBody.mass[eid] ?? 1;
    // F = m * g
    Force.y[eid] = (Force.y[eid] ?? 0) + mass * gy;
  }

  return world;
}

/* ----------------------------------------------------------------------------
 * 4) APPLY FORCES => VELOCITY
 * ----------------------------------------------------------------------------
 */
export function applyForcesSystem(world: World, dt: number) {
  const entities = query(world, [Force, RigidBody]);

  for (const eid of entities) {
    if ((RigidBody.isStatic[eid] ?? 0) === 1) {
      Force.x[eid] = 0;
      Force.y[eid] = 0;
      Force.torque[eid] = 0;
      continue;
    }

    const fx = Force.x[eid] ?? 0;
    const fy = Force.y[eid] ?? 0;
    const torque = Force.torque[eid] ?? 0;

    const mass = Math.max(RigidBody.mass[eid] ?? 1, 0.0001);
    const moment = Math.max(RigidBody.momentOfInertia[eid] ?? 1, 0.0001);

    // v += (F / m) * dt
    Velocity.x[eid] = (Velocity.x[eid] ?? 0) + (fx / mass) * dt;
    Velocity.y[eid] = (Velocity.y[eid] ?? 0) + (fy / mass) * dt;

    // w += (torque / I) * dt
    RigidBody.angularVelocity[eid] =
      (RigidBody.angularVelocity[eid] ?? 0) + (torque / moment) * dt;

    // clear forces
    Force.x[eid] = 0;
    Force.y[eid] = 0;
    Force.torque[eid] = 0;
  }

  return world;
}

/* ----------------------------------------------------------------------------
 * 5) INTEGRATION SYSTEM
 * ----------------------------------------------------------------------------
 * Integrate velocity -> position, angularVelocity -> rotation,
 * handle friction, damping, etc.
 */
export function integrationSystem(world: World, dt: number) {
  const entities = query(world, [Transform, RigidBody, Velocity]);

  for (const eid of entities) {
    if ((RigidBody.isStatic[eid] ?? 0) === 1) continue;

    let vx = Velocity.x[eid] ?? 0;
    let vy = Velocity.y[eid] ?? 0;

    // position
    Transform.x[eid] = (Transform.x[eid] ?? 0) + vx * dt;
    Transform.y[eid] = (Transform.y[eid] ?? 0) + vy * dt;

    // rotation
    let av = RigidBody.angularVelocity[eid] ?? 0;
    RigidBody.rotation[eid] = (RigidBody.rotation[eid] ?? 0) + av * dt;

    // linear damping
    const ld = RigidBody.linearDamping[eid] ?? 0;
    if (ld > 0) {
      const speed = Math.hypot(vx, vy);
      if (speed > 1e-4) {
        const factor = Math.max(0, 1 - ld * dt);
        vx *= factor;
        vy *= factor;
      } else {
        vx = 0;
        vy = 0;
      }
    }

    // angular damping
    const ad = RigidBody.angularDamping[eid] ?? 0;
    if (ad > 0) {
      const newAV = av * Math.max(0, 1 - ad * dt);
      av = Math.abs(newAV) < 1e-4 ? 0 : newAV;
    }

    // friction
    const mass = Math.max(RigidBody.mass[eid] ?? 1, 0.0001);
    const friction = RigidBody.friction[eid] ?? 0;
    if (friction > 0) {
      const frictionForce = friction * mass;
      const speed = Math.hypot(vx, vy);
      if (speed > 1e-4) {
        const frictionDelta = (frictionForce * dt) / speed;
        const speedAfter = Math.max(speed - frictionDelta, 0);
        const ratio = speedAfter / speed;
        vx *= ratio;
        vy *= ratio;
      } else {
        vx = 0;
        vy = 0;
      }
    }

    // store final velocity
    Velocity.x[eid] = vx;
    Velocity.y[eid] = vy;
    RigidBody.angularVelocity[eid] = av;
  }

  return world;
}

/* ----------------------------------------------------------------------------
 * 6) COLLISION SYSTEM (ADVANCED TORQUE)
 * ----------------------------------------------------------------------------
 * Single-contact approach: find contact midpoint, compute impulse affecting
 * linear + angular velocities.
 */
export function collisionSystem(world: World) {
  // Track old manifolds to clean up at the end
  const oldManifolds = query(world, [CollisionManifold]);
  const manifoldsToRemove = new Set(oldManifolds);

  // get all polygon entities
  const entities = query(world, [Transform, Polygon]);

  // naive O(n^2)
  for (const entityA of entities) {
    // Must have a RigidBody for torque-based collisions
    if (!hasComponent(world, entityA, RigidBody)) {
      continue;
    }
    const vertsA = getWorldVertices(world, entityA);

    const isStaticA = (RigidBody.isStatic[entityA] ?? 0) === 1;
    const massA = RigidBody.mass[entityA] ?? 1;
    const I_A = Math.max(RigidBody.momentOfInertia[entityA] ?? 1, 0.0001);
    const invMassA = isStaticA || massA <= 0 ? 0 : 1 / massA;
    const invIA = isStaticA ? 0 : 1 / I_A;
    const restA = RigidBody.restitution[entityA] ?? 0;

    let vxA = Velocity.x[entityA] ?? 0;
    let vyA = Velocity.y[entityA] ?? 0;
    let wA = RigidBody.angularVelocity[entityA] ?? 0;

    const centerA = centroid(vertsA);

    for (const entityB of entities) {
      if (entityB === entityA) continue;
      if (!hasComponent(world, entityB, RigidBody)) {
        continue;
      }
      const vertsB = getWorldVertices(world, entityB);

      const isStaticB = (RigidBody.isStatic[entityB] ?? 0) === 1;
      const massB = RigidBody.mass[entityB] ?? 1;
      const I_B = Math.max(RigidBody.momentOfInertia[entityB] ?? 1, 0.0001);
      const invMassB = isStaticB || massB <= 0 ? 0 : 1 / massB;
      const invIB = isStaticB ? 0 : 1 / I_B;
      const restB = RigidBody.restitution[entityB] ?? 0;

      let vxB = Velocity.x[entityB] ?? 0;
      let vyB = Velocity.y[entityB] ?? 0;
      let wB = RigidBody.angularVelocity[entityB] ?? 0;

      const centerB = centroid(vertsB);

      // both static => skip
      if (isStaticA && isStaticB) continue;

      // SAT
      const { collided, overlap, overlapAxis } = satCollision(vertsA, vertsB);
      if (!collided) continue;

      // create manifold
      const mEid = createCollisionManifold(world);

      // Remove this manifold from the cleanup set since we're reusing it
      manifoldsToRemove.delete(mEid);

      // normal from A->B
      const axisDirection: [number, number] = [
        centerB[0] - centerA[0],
        centerB[1] - centerA[1],
      ];
      if (dot(axisDirection, overlapAxis) < 0) {
        overlapAxis[0] = -overlapAxis[0];
        overlapAxis[1] = -overlapAxis[1];
      }
      normalize(overlapAxis);

      // fill manifold
      CollisionManifold.entity1[mEid] = entityA;
      CollisionManifold.entity2[mEid] = entityB;
      CollisionManifold.normalX[mEid] = overlapAxis[0];
      CollisionManifold.normalY[mEid] = overlapAxis[1];
      CollisionManifold.penetrationDepth[mEid] = overlap;
      const cx = (centerA[0] + centerB[0]) * 0.5;
      const cy = (centerA[1] + centerB[1]) * 0.5;
      CollisionManifold.contactPointX[mEid] = cx;
      CollisionManifold.contactPointY[mEid] = cy;

      // 1) Positional correction
      const totalInvMass = invMassA + invMassB;
      if (totalInvMass > 0) {
        const pushOverlap = overlap;
        const pushA = (invMassA / totalInvMass) * pushOverlap;
        const pushB = (invMassB / totalInvMass) * pushOverlap;
        if (!isStaticA) {
          Transform.x[entityA] =
            (Transform.x[entityA] ?? 0) - overlapAxis[0] * pushA;
          Transform.y[entityA] =
            (Transform.y[entityA] ?? 0) - overlapAxis[1] * pushA;
        }
        if (!isStaticB) {
          Transform.x[entityB] =
            (Transform.x[entityB] ?? 0) + overlapAxis[0] * pushB;
          Transform.y[entityB] =
            (Transform.y[entityB] ?? 0) + overlapAxis[1] * pushB;
        }
      }

      // 2) Single-contact: midpoint
      const contactPoint: [number, number] = [cx, cy];
      const rA: [number, number] = [
        contactPoint[0] - centerA[0],
        contactPoint[1] - centerA[1],
      ];
      const rB: [number, number] = [
        contactPoint[0] - centerB[0],
        contactPoint[1] - centerB[1],
      ];

      // velocity at contact
      const velA = [
        vxA + crossScalarVector(wA, rA)[0],
        vyA + crossScalarVector(wA, rA)[1],
      ] as [number, number];
      const velB = [
        vxB + crossScalarVector(wB, rB)[0],
        vyB + crossScalarVector(wB, rB)[1],
      ] as [number, number];

      const relativeVelocity: [number, number] = [
        velB[0] - velA[0],
        velB[1] - velA[1],
      ];
      const relativeSpeedDot = dot(relativeVelocity, overlapAxis);

      // Only apply collision response if objects are moving towards each other
      if (relativeSpeedDot > -0.0001) {
        // Objects are separating or barely moving towards each other
        // Just apply positional correction and skip impulse
        continue;
      }

      // average restitution
      const averageRest = (restA + restB) * 0.5;

      // denominator
      const rAxN = cross2D(rA, overlapAxis);
      const rBxN = cross2D(rB, overlapAxis);
      const denom =
        invMassA + invMassB + rAxN * rAxN * invIA + rBxN * rBxN * invIB;
      if (denom < 0.000_001) {
        continue;
      }

      // impulse scalar - add a small bias to prevent sticking
      const bias = 0.2; // Adjust this value if needed
      const impulseScalar =
        (-(1 + averageRest) * (relativeSpeedDot + bias)) / denom;
      const impulse: [number, number] = [
        overlapAxis[0] * impulseScalar,
        overlapAxis[1] * impulseScalar,
      ];

      // apply linear impulse
      if (!isStaticA) {
        vxA -= impulse[0] * invMassA;
        vyA -= impulse[1] * invMassA;
      }
      if (!isStaticB) {
        vxB += impulse[0] * invMassB;
        vyB += impulse[1] * invMassB;
      }

      // apply angular impulse
      if (!isStaticA) {
        const torqueA = cross2D(rA, impulse);
        wA -= torqueA * invIA;
      }
      if (!isStaticB) {
        const torqueB = cross2D(rB, impulse);
        wB += torqueB * invIB;
      }

      // write back final velocities
      Velocity.x[entityA] = vxA;
      Velocity.y[entityA] = vyA;
      RigidBody.angularVelocity[entityA] = wA;

      Velocity.x[entityB] = vxB;
      Velocity.y[entityB] = vyB;
      RigidBody.angularVelocity[entityB] = wB;
    }
  }

  // Clean up old manifolds after all collision processing is done
  for (const mid of manifoldsToRemove) {
    removeComponent(world, mid, CollisionManifold);
    removeEntity(world, mid);
  }

  return world;
}

/* ----------------------------------------------------------------------------
 * 7) MASTER PHYSICS SYSTEM
 * ----------------------------------------------------------------------------
 * Sub-steps to mitigate tunneling
 */
export function createPhysicsSystem() {
  return function physicsSystem(world: World, deltaTime: number) {
    // clamp dt
    const clampedDt = Math.min(deltaTime, MAX_TIMESTEP);

    // subdivide
    const steps = Math.ceil(clampedDt / FIXED_TIMESTEP);
    const subDt = clampedDt / steps;

    for (let index = 0; index < steps; index++) {
      // 1) Gravity
      applyGravitySystem(world);

      // 2) Forces => velocity
      applyForcesSystem(world, subDt);

      // 3) Integrate
      integrationSystem(world, subDt);

      // 4) Collisions (torque-based)
      collisionSystem(world);
    }

    return world;
  };
}

/* ----------------------------------------------------------------------------
 * 8) RENDERING IN PIXELS
 * ----------------------------------------------------------------------------
 * Positions are in meters. For display:
 *   const xPx = (Position.x[eid] ?? 0) * PIXELS_PER_METER;
 *   const yPx = (Position.y[eid] ?? 0) * PIXELS_PER_METER;
 */
