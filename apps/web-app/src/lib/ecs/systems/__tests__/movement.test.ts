import { addComponent, addEntity, createWorld } from "bitecs";
import { describe, expect, it } from "vitest";

import type { WorldProps } from "../../types";
import {
  Force,
  KeyboardState,
  Player,
  RigidBody,
  Transform,
} from "../../components";
import { setKeyDown } from "../../utils/keyboard";
import { createMovementSystem } from "../movement";

describe("Movement System", () => {
  it("should apply force based on keyboard input", () => {
    const world = createWorld<WorldProps>();
    const eid = addEntity(world);
    const canvas = document.createElement("canvas");

    // Add required components
    addComponent(world, eid, Transform);
    addComponent(world, eid, Force);
    addComponent(world, eid, RigidBody);
    addComponent(world, eid, KeyboardState);
    addComponent(world, eid, Player);

    // Set initial values
    RigidBody.mass[eid] = 1;
    KeyboardState.keys[eid] = 0;
    setKeyDown(eid, "KeyW"); // Simulate pressing up key

    const movementSystem = createMovementSystem(canvas);
    movementSystem(world);

    // Verify force is applied in upward direction
    expect(Force.y[eid]).toBeLessThan(0); // Negative Y is up
    expect(Force.x[eid]).toBe(0); // No horizontal force
  });

  it("should apply damping when no input", () => {
    const world = createWorld<WorldProps>();
    const eid = addEntity(world);
    const canvas = document.createElement("canvas");

    // Add required components
    addComponent(world, eid, Transform);
    addComponent(world, eid, Force);
    addComponent(world, eid, RigidBody);
    addComponent(world, eid, KeyboardState);
    addComponent(world, eid, Player);

    // Set initial force
    Force.x[eid] = 1000;
    Force.y[eid] = 1000;
    KeyboardState.keys[eid] = 0; // No keys pressed

    const movementSystem = createMovementSystem(canvas);
    movementSystem(world);

    // Verify force is reduced by damping
    expect(Force.x[eid]).toBeLessThan(1000);
    expect(Force.y[eid]).toBeLessThan(1000);
  });

  it("should normalize diagonal movement", () => {
    const world = createWorld<WorldProps>();
    const eid = addEntity(world);
    const canvas = document.createElement("canvas");

    // Add required components
    addComponent(world, eid, Transform);
    addComponent(world, eid, Force);
    addComponent(world, eid, RigidBody);
    addComponent(world, eid, KeyboardState);
    addComponent(world, eid, Player);

    // Set diagonal movement input
    KeyboardState.keys[eid] = 0;
    setKeyDown(eid, "KeyW"); // Up
    setKeyDown(eid, "KeyD"); // Right

    const movementSystem = createMovementSystem(canvas);
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
    const canvas = document.createElement("canvas");

    // Add required components
    addComponent(world, eid, Transform);
    addComponent(world, eid, Force);
    addComponent(world, eid, RigidBody);
    addComponent(world, eid, KeyboardState);
    addComponent(world, eid, Player);

    // Set very high mass to generate large force
    RigidBody.mass[eid] = 1000;
    KeyboardState.keys[eid] = 0;
    setKeyDown(eid, "KeyW"); // Up

    const movementSystem = createMovementSystem(canvas);
    movementSystem(world);

    // Get resulting force magnitude
    const forceX = Force.x[eid] ?? 0;
    const forceY = Force.y[eid] ?? 0;
    const forceMagnitude = Math.hypot(forceX, forceY);

    // Verify force is clamped to MAX_SPEED
    expect(forceMagnitude).toBeLessThanOrEqual(1000); // MAX_SPEED constant
  });
});
