import { addComponent, addEntity, createWorld } from "bitecs";
import { describe, expect, it } from "vitest";

import {
  CollisionManifold,
  Force,
  Gravity,
  Polygon,
  RigidBody,
  Transform,
  Velocity,
} from "../../components";
import { createPhysicsSystem } from "../physics";

describe("Physics System", () => {
  it("should apply gravity to non-static bodies", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up entity with gravity
    addComponent(world, eid, Transform);
    addComponent(world, eid, RigidBody);
    addComponent(world, eid, Force);
    addComponent(world, eid, Gravity);
    addComponent(world, eid, Velocity);

    Transform.y[eid] = 0;
    RigidBody.mass[eid] = 1;
    Gravity.y[eid] = 9.81; // Standard gravity
    RigidBody.isStatic[eid] = 0;

    const physicsSystem = createPhysicsSystem();
    physicsSystem(world, 1 / 60); // One frame at 60 FPS

    // Verify gravity force was applied
    // F = ma, so with m=1, F should equal g
    expect(Velocity.y[eid]).toBeCloseTo(9.81 * (1 / 60), 4);
  });

  it("should not apply gravity to static bodies", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up static entity with gravity
    addComponent(world, eid, Transform);
    addComponent(world, eid, RigidBody);
    addComponent(world, eid, Force);
    addComponent(world, eid, Gravity);
    addComponent(world, eid, Velocity);

    Transform.y[eid] = 0;
    RigidBody.mass[eid] = 1;
    Gravity.y[eid] = 9.81;
    RigidBody.isStatic[eid] = 1; // Static body

    const physicsSystem = createPhysicsSystem();
    physicsSystem(world, 1 / 60);

    // Verify no forces were applied
    expect(Force.x[eid]).toBe(0);
    expect(Force.y[eid]).toBe(0);
    expect(Velocity.y[eid]).toBeCloseTo(0, 4);
  });

  it("should apply forces and update velocity", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up entity with force
    addComponent(world, eid, Transform);
    addComponent(world, eid, RigidBody);
    addComponent(world, eid, Force);
    addComponent(world, eid, Velocity);

    RigidBody.mass[eid] = 2; // 2kg mass
    Force.x[eid] = 10; // 10N force
    RigidBody.isStatic[eid] = 0;

    const physicsSystem = createPhysicsSystem();
    physicsSystem(world, 1 / 60);

    // F = ma, so a = F/m = 10/2 = 5 m/s²
    // v = at, so v = 5 * (1/60) ≈ 0.0833 m/s
    expect(Velocity.x[eid]).toBeCloseTo(5 * (1 / 60), 4);
  });

  it("should integrate velocity to update position", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up entity with velocity
    addComponent(world, eid, Transform);
    addComponent(world, eid, RigidBody);
    addComponent(world, eid, Velocity);

    Transform.x[eid] = 0;
    Velocity.x[eid] = 1; // 1 m/s
    RigidBody.isStatic[eid] = 0;

    const physicsSystem = createPhysicsSystem();
    physicsSystem(world, 1 / 60);

    // x = vt, so x = 1 * (1/60) ≈ 0.0167 m
    expect(Transform.x[eid]).toBeCloseTo(1 / 60, 4);
  });

  it("should handle polygon collision detection", () => {
    const world = createWorld();
    const eid1 = addEntity(world);
    const eid2 = addEntity(world);

    // Set up two overlapping squares
    addComponent(world, eid1, Transform);
    addComponent(world, eid1, Polygon);
    addComponent(world, eid1, RigidBody);
    Transform.x[eid1] = 0;
    Transform.y[eid1] = 0;
    Polygon.vertexCount[eid1] = 4;
    Polygon.verticesX[eid1] = new Float32Array([-1, 1, 1, -1]);
    Polygon.verticesY[eid1] = new Float32Array([-1, -1, 1, 1]);

    addComponent(world, eid2, Transform);
    addComponent(world, eid2, Polygon);
    addComponent(world, eid2, RigidBody);
    Transform.x[eid2] = 1;
    Transform.y[eid2] = 0;
    Polygon.vertexCount[eid2] = 4;
    Polygon.verticesX[eid2] = new Float32Array([-1, 1, 1, -1]);
    Polygon.verticesY[eid2] = new Float32Array([-1, -1, 1, 1]);

    const physicsSystem = createPhysicsSystem();
    physicsSystem(world, 1 / 60);

    // Check if collision manifold was created
    const manifolds = Object.keys(CollisionManifold.entity1).filter(
      (eid) => CollisionManifold.entity1[Number(eid)] === eid1,
    );
    expect(manifolds).toHaveLength(1);

    const manifoldEid = Number(manifolds[0]);
    expect(CollisionManifold.entity2[manifoldEid]).toBe(eid2);
    expect(CollisionManifold.penetrationDepth[manifoldEid]).toBeGreaterThan(0);
  });

  it("should resolve collisions with correct restitution", () => {
    const world = createWorld();
    const eid1 = addEntity(world);
    const eid2 = addEntity(world);

    // Set up two colliding bodies
    addComponent(world, eid1, Transform);
    addComponent(world, eid1, Polygon);
    addComponent(world, eid1, RigidBody);
    addComponent(world, eid1, Velocity);
    Transform.x[eid1] = 0;
    Transform.y[eid1] = 0;
    Velocity.x[eid1] = 1;
    RigidBody.restitution[eid1] = 0.5;
    Polygon.vertexCount[eid1] = 4;
    Polygon.verticesX[eid1] = new Float32Array([-1, 1, 1, -1]);
    Polygon.verticesY[eid1] = new Float32Array([-1, -1, 1, 1]);

    addComponent(world, eid2, Transform);
    addComponent(world, eid2, Polygon);
    addComponent(world, eid2, RigidBody);
    addComponent(world, eid2, Velocity);
    Transform.x[eid2] = 1;
    Transform.y[eid2] = 0;
    Velocity.x[eid2] = -1;
    RigidBody.restitution[eid2] = 0.5;
    Polygon.vertexCount[eid2] = 4;
    Polygon.verticesX[eid2] = new Float32Array([-1, 1, 1, -1]);
    Polygon.verticesY[eid2] = new Float32Array([-1, -1, 1, 1]);

    const physicsSystem = createPhysicsSystem();
    physicsSystem(world, 1 / 60);

    // Velocities should be reversed and scaled by average restitution
    expect(Velocity.x[eid1]).toBeLessThan(0);
    expect(Velocity.x[eid2]).toBeGreaterThan(0);
  });

  it("should handle angular velocity and torque", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up rotating body
    addComponent(world, eid, Transform);
    addComponent(world, eid, RigidBody);
    addComponent(world, eid, Force);
    RigidBody.momentOfInertia[eid] = 1;
    Force.torque[eid] = Math.PI; // Apply π N⋅m torque
    RigidBody.isStatic[eid] = 0;

    const physicsSystem = createPhysicsSystem();
    physicsSystem(world, 1 / 60);

    // τ = Iα, so α = τ/I = π rad/s²
    // ω = αt, so ω = π * (1/60) rad/s
    expect(RigidBody.angularVelocity[eid]).toBeCloseTo(Math.PI / 60, 4);
  });
});
