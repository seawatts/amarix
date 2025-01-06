import type { World } from "bitecs";
import {
  addComponent,
  addEntity,
  hasComponent,
  query,
  removeComponent,
  removeEntity,
} from "bitecs";

import {
  CollisionManifold,
  Polygon,
  Position,
  RigidBody,
  Velocity,
} from "../../components";

/**
 * Gets edge normal (perpendicular vector) for SAT collision detection
 */
function getEdgeNormal(p1: number[], p2: number[]): number[] {
  const dx = (p2[0] ?? 0) - (p1[0] ?? 0);
  const dy = (p2[1] ?? 0) - (p1[1] ?? 0);
  return [dy, -dx]; // perpendicular
}

/**
 * Normalizes a vector in-place
 */
function normalize(vec: number[]): void {
  const length = Math.hypot(vec[0] ?? 0, vec[1] ?? 0);
  if (length > 0.000_001) {
    vec[0] = (vec[0] ?? 0) / length;
    vec[1] = (vec[1] ?? 0) / length;
  }
}

/**
 * Projects vertices onto an axis and returns min/max values
 */
function projectVertices(
  vertices: number[][],
  axis: number[],
): [number, number] {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const [vx, vy] of vertices) {
    const axisX = axis[0] ?? 0;
    const axisY = axis[1] ?? 0;
    const projection = (vx ?? 0) * axisX + (vy ?? 0) * axisY;
    if (projection < min) min = projection;
    if (projection > max) max = projection;
  }
  return [min, max];
}

/**
 * Calculates centroid of a polygon
 */
function centroid(verts: number[][]): [number, number] {
  let sumX = 0;
  let sumY = 0;
  for (const [x, y] of verts) {
    sumX += x ?? 0;
    sumY += y ?? 0;
  }
  return [sumX / verts.length, sumY / verts.length];
}

/**
 * Transform local vertices to world-space.
 * Includes rotation from RigidBody if present.
 */
function getWorldVertices(eid: number): number[][] {
  const x0 = Position.x[eid] ?? 0;
  const y0 = Position.y[eid] ?? 0;
  const vertCount = Polygon.vertexCount[eid] ?? 0;
  const xs = Polygon.verticesX[eid];
  const ys = Polygon.verticesY[eid];
  const rotation = Polygon.rotation[eid] ?? 0;

  const result: number[][] = [];
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  for (let index = 0; index < vertCount; index++) {
    const localX = xs?.[index] ?? 0;
    const localY = ys?.[index] ?? 0;

    // Apply rotation and translation
    const rotX = localX * cos - localY * sin;
    const rotY = localX * sin + localY * cos;
    result.push([x0 + rotX, y0 + rotY]);
  }
  return result;
}

/**
 * SAT collision check between two convex polygons
 */
function satCollision(
  vertsA: number[][],
  vertsB: number[][],
): { collided: boolean; overlap: number; overlapAxis: number[] } {
  // Collect edges from both polygons
  const edges: [number[], number[]][] = [];

  for (let index = 0; index < vertsA.length; index++) {
    const p1 = vertsA[index];
    const p2 = vertsA[(index + 1) % vertsA.length];
    if (p1 && p2) {
      edges.push([p1, p2]);
    }
  }
  for (let index = 0; index < vertsB.length; index++) {
    const p1 = vertsB[index];
    const p2 = vertsB[(index + 1) % vertsB.length];
    if (p1 && p2) {
      edges.push([p1, p2]);
    }
  }

  let minOverlap = Number.POSITIVE_INFINITY;
  let overlapAxis: number[] = [0, 0];

  for (const [p1, p2] of edges) {
    const axis = getEdgeNormal(p1, p2);
    normalize(axis);

    const [minA, maxA] = projectVertices(vertsA, axis);
    const [minB, maxB] = projectVertices(vertsB, axis);

    // If there's a gap, no collision
    if (maxA < minB || maxB < minA) {
      return { collided: false, overlap: 0, overlapAxis: [0, 0] };
    }

    // Check overlap distance on this axis
    const overlapDistribution = Math.min(maxA, maxB) - Math.max(minA, minB);
    if (overlapDistribution < minOverlap) {
      minOverlap = overlapDistribution;
      overlapAxis = [...axis];
    }
  }

  return { collided: true, overlap: minOverlap, overlapAxis };
}

/**
 * Collision detection and resolution using SAT
 */
export function collisionSystem(world: World) {
  const entities = query(world, [Position, Polygon]);

  // Clear old collision manifolds and their entities
  const manifolds = query(world, [CollisionManifold]);
  for (const eid of manifolds) {
    removeComponent(world, eid, CollisionManifold);
    removeEntity(world, eid);
  }

  // O(n^2) naive collision check
  for (const entityA of entities) {
    const hasRbA = hasComponent(world, entityA, RigidBody);
    const vertsA = getWorldVertices(entityA);

    let isStaticA = false;
    let restitutionA = 0;
    let vxA = 0;
    let vyA = 0;
    if (hasRbA) {
      isStaticA = RigidBody.isStatic[entityA] === 1;
      restitutionA = RigidBody.restitution[entityA] ?? 0;
      vxA = Velocity.x[entityA] ?? 0;
      vyA = Velocity.y[entityA] ?? 0;
    }

    for (const entityB of entities) {
      if (entityA === entityB) continue;

      const hasRbB = hasComponent(world, entityB, RigidBody);
      const vertsB = getWorldVertices(entityB);

      let isStaticB = false;
      let restitutionB = 0;
      let vxB = 0;
      let vyB = 0;
      if (hasRbB) {
        isStaticB = RigidBody.isStatic[entityB] === 1;
        restitutionB = RigidBody.restitution[entityB] ?? 0;
        vxB = Velocity.x[entityB] ?? 0;
        vyB = Velocity.y[entityB] ?? 0;
      }

      // Both static => no collision resolution needed
      if (isStaticA && isStaticB) continue;

      // SAT collision test
      const { collided, overlap, overlapAxis } = satCollision(vertsA, vertsB);
      if (!collided) continue;

      // Create collision manifold
      const manifoldEid = addEntity(world);
      addComponent(world, manifoldEid, CollisionManifold);

      // Determine push-out direction from A->B
      const centerA = centroid(vertsA);
      const centerB = centroid(vertsB);
      const axisDirection = [centerB[0] - centerA[0], centerB[1] - centerA[1]];
      const dot =
        (axisDirection[0] ?? 0) * (overlapAxis[0] ?? 0) +
        (axisDirection[1] ?? 0) * (overlapAxis[1] ?? 0);
      if (dot < 0) {
        overlapAxis[0] = -(overlapAxis[0] ?? 0);
        overlapAxis[1] = -(overlapAxis[1] ?? 0);
      }
      normalize(overlapAxis);

      // Store collision data in manifold
      CollisionManifold.entity1[manifoldEid] = entityA;
      CollisionManifold.entity2[manifoldEid] = entityB;
      CollisionManifold.normalX[manifoldEid] = overlapAxis[0] ?? 0;
      CollisionManifold.normalY[manifoldEid] = overlapAxis[1] ?? 0;
      CollisionManifold.penetrationDepth[manifoldEid] = overlap;

      // Calculate contact point (middle of overlap)
      const contactX = (centerA[0] + centerB[0]) / 2;
      const contactY = (centerA[1] + centerB[1]) / 2;
      CollisionManifold.contactPointX[manifoldEid] = contactX;
      CollisionManifold.contactPointY[manifoldEid] = contactY;

      // Distribute overlap
      const moveDistribution = overlap / (hasRbA && hasRbB ? 2 : 1);

      // Push out A
      if (hasRbA && !isStaticA) {
        Position.x[entityA] =
          (Position.x[entityA] ?? 0) - (overlapAxis[0] ?? 0) * moveDistribution;
        Position.y[entityA] =
          (Position.y[entityA] ?? 0) - (overlapAxis[1] ?? 0) * moveDistribution;
      }
      // Push out B
      if (hasRbB && !isStaticB) {
        Position.x[entityB] =
          (Position.x[entityB] ?? 0) + (overlapAxis[0] ?? 0) * moveDistribution;
        Position.y[entityB] =
          (Position.y[entityB] ?? 0) + (overlapAxis[1] ?? 0) * moveDistribution;
      }

      // Simple linear bounce
      if (hasRbA && hasRbB) {
        const combinedRest = (restitutionA + restitutionB) * 0.5;
        const relativeVelX = vxB - vxA;
        const relativeVelY = vyB - vyA;
        const relativeSpeed =
          relativeVelX * (overlapAxis[0] ?? 0) +
          relativeVelY * (overlapAxis[1] ?? 0);

        // Only respond if objects moving toward each other
        if (relativeSpeed < 0) {
          const impulse = -(1 + combinedRest) * relativeSpeed * 0.5;
          if (!isStaticA) {
            Velocity.x[entityA] =
              (Velocity.x[entityA] ?? 0) - impulse * (overlapAxis[0] ?? 0);
            Velocity.y[entityA] =
              (Velocity.y[entityA] ?? 0) - impulse * (overlapAxis[1] ?? 0);
          }
          if (!isStaticB) {
            Velocity.x[entityB] =
              (Velocity.x[entityB] ?? 0) + impulse * (overlapAxis[0] ?? 0);
            Velocity.y[entityB] =
              (Velocity.y[entityB] ?? 0) + impulse * (overlapAxis[1] ?? 0);
          }
        }
      }
    }
  }

  return world;
}
