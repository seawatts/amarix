import { createWorld, query } from "bitecs";
import { describe, expect, it } from "vitest";

import type { WorldProps } from "../../types";
import {
  Collidable,
  CollisionMask,
  Debug,
  Named,
  Polygon,
  RigidBody,
  Transform,
} from "../../components";
import { createGround } from "../ground";

describe("Ground Entity", () => {
  it("should create a ground with all required components", () => {
    const world = createWorld<WorldProps>();
    const groundEid = createGround(world, {
      height: 20,
      width: 800,
      x: 400,
      y: 590,
    });

    // Check if ground entity has all required components
    const grounds = query(world, [
      Transform,
      Polygon,
      RigidBody,
      Collidable,
      Named,
      Debug,
    ]);
    expect(grounds).toContain(groundEid);

    // Check transform values
    expect(Transform.x[groundEid]).toBe(400);
    expect(Transform.y[groundEid]).toBe(590);
    expect(Transform.rotation[groundEid]).toBe(0);
    expect(Transform.scaleX[groundEid]).toBe(1);
    expect(Transform.scaleY[groundEid]).toBe(1);

    // Check physics values
    expect(RigidBody.mass[groundEid]).toBe(0); // Infinite mass
    expect(RigidBody.friction[groundEid]).toBeCloseTo(0.5, 4);
    expect(RigidBody.restitution[groundEid]).toBeCloseTo(0.2, 4);
    expect(RigidBody.isStatic[groundEid]).toBe(1);

    // Check collision values
    expect(Collidable.isActive[groundEid]).toBe(1);
    expect(Collidable.isTrigger[groundEid]).toBe(0);
    expect(Collidable.layer[groundEid]).toBe(CollisionMask.Wall);
    expect(Collidable.mask[groundEid]).toBe(
      CollisionMask.Player | CollisionMask.NPC,
    );

    // Check name
    expect(Named.name[groundEid]).toBe("Ground");
  });

  it("should create a ground with correct polygon vertices", () => {
    const world = createWorld<WorldProps>();
    const groundEid = createGround(world, {
      height: 100,
      width: 200,
      x: 0,
      y: 0,
    });

    // Check polygon values
    expect(Polygon.isConvex[groundEid]).toBe(1);
    expect(Polygon.vertexCount[groundEid]).toBe(4);
    expect(Polygon.originX[groundEid]).toBe(0);
    expect(Polygon.originY[groundEid]).toBe(0);

    // Check vertices (200x100 box centered at origin)
    const verticesX = Polygon.verticesX[groundEid] ?? [];
    const verticesY = Polygon.verticesY[groundEid] ?? [];

    // Verify each vertex position
    const vertices = [
      { x: -100, y: -50 }, // Top-left
      { x: 100, y: -50 }, // Top-right
      { x: 100, y: 50 }, // Bottom-right
      { x: -100, y: 50 }, // Bottom-left
    ];

    for (const [index, vertex] of vertices.entries()) {
      expect(verticesX[index]).toBe(vertex.x);
      expect(verticesY[index]).toBe(vertex.y);
    }
  });
});
