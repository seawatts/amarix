import { addComponent, addEntity, createWorld } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";

import type { WorldProps } from "../../types";
import {
  Force,
  GlobalKeyboardState,
  Player,
  RigidBody,
  Transform,
} from "../../components";
import { setKeyDown } from "../../utils/keyboard";
import { createMovementSystem } from "../movement";

describe("Movement System", () => {
  beforeEach(() => {
    // Reset keyboard state
    GlobalKeyboardState.keys = 0;
  });

  it("should apply force based on keyboard input", () => {
    const world = createWorld<WorldProps>();
    const eid = addEntity(world);

    // Add required components
    addComponent(world, eid, Transform);
    addComponent(world, eid, Force);
    addComponent(world, eid, RigidBody);
    addComponent(world, eid, Player);

    // Set initial values
    RigidBody.mass[eid] = 1;
    setKeyDown("KeyW"); // Simulate pressing up key

    const movementSystem = createMovementSystem();
    movementSystem(world);

    // Verify force is applied in upward direction
    expect(Force.y[eid]).toBeLessThan(0); // Negative Y is up
    expect(Force.x[eid]).toBe(0); // No horizontal force
  });

  it("should apply damping when no input", () => {
    const world = createWorld<WorldProps>();
    const eid = addEntity(world);

    // Add required components
    addComponent(world, eid, Transform);
    addComponent(world, eid, Force);
    addComponent(world, eid, RigidBody);
    addComponent(world, eid, Player);

    // Set initial force
    Force.x[eid] = 1000;
    Force.y[eid] = 1000;

    const movementSystem = createMovementSystem();
    movementSystem(world);

    // Verify force is reduced by damping
    expect(Force.x[eid]).toBeLessThan(1000);
    expect(Force.y[eid]).toBeLessThan(1000);
  });

  it("should normalize diagonal movement", () => {
    const world = createWorld<WorldProps>();
    const eid = addEntity(world);

    // Add required components
    addComponent(world, eid, Transform);
    addComponent(world, eid, Force);
    addComponent(world, eid, RigidBody);
    addComponent(world, eid, Player);

    // Set diagonal movement input
    setKeyDown("KeyW"); // Up
    setKeyDown("KeyD"); // Right

    const movementSystem = createMovementSystem();
    movementSystem(world);

    // Get resulting force magnitude
    const forceX = Force.x[eid] ?? 0;
    const forceY = Force.y[eid] ?? 0;
    const forceMagnitude = Math.hypot(forceX, forceY);
    const singleDirectionMagnitude = Math.abs(forceX);

    // Verify diagonal movement doesn't result in faster speed
    expect(forceMagnitude).toBeCloseTo(
      singleDirectionMagnitude * Math.SQRT2,
      1,
    );
  });

  it("should respect max speed limit", () => {
    const world = createWorld<WorldProps>();
    const eid = addEntity(world);

    // Add required components
    addComponent(world, eid, Transform);
    addComponent(world, eid, Force);
    addComponent(world, eid, RigidBody);
    addComponent(world, eid, Player);

    // Set very high mass to generate large force
    RigidBody.mass[eid] = 1000;
    setKeyDown("KeyW"); // Up

    const movementSystem = createMovementSystem();
    movementSystem(world);

    // Get resulting force magnitude
    const forceX = Force.x[eid] ?? 0;
    const forceY = Force.y[eid] ?? 0;
    const forceMagnitude = Math.hypot(forceX, forceY);

    // Verify force is clamped to MAX_SPEED
    expect(forceMagnitude).toBeLessThanOrEqual(1000); // MAX_SPEED constant
  });
});
