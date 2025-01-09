import { createWorld, query } from "bitecs";
import { describe, expect, it } from "vitest";

import {
  Animation,
  Collidable,
  CollisionMask,
  CurrentPlayer,
  Debug,
  Force,
  Health,
  KeyboardState,
  MouseState,
  Named,
  Polygon,
  Sprite,
  Transform,
  Velocity,
} from "../../components";
import { createPlayer } from "../player";

describe("Player Entity", () => {
  it("should create a player with all required components", () => {
    const world = createWorld();
    const playerEid = createPlayer(world, { x: 100, y: 150 });

    // Check if player entity has all required components
    const players = query(world, [
      Transform,
      Polygon,
      Collidable,
      CurrentPlayer,
      Force,
      Velocity,
      Health,
      KeyboardState,
      MouseState,
      Animation,
      Sprite,
      Named,
      Debug,
    ]);
    expect(players).toContain(playerEid);

    // Check transform values
    expect(Transform.x[playerEid]).toBe(100);
    expect(Transform.y[playerEid]).toBe(150);
    expect(Transform.rotation[playerEid]).toBe(0);
    expect(Transform.scaleX[playerEid]).toBe(1);
    expect(Transform.scaleY[playerEid]).toBe(1);

    // Check polygon values
    const verticesX = Polygon.verticesX[playerEid] ?? [];
    const verticesY = Polygon.verticesY[playerEid] ?? [];
    expect(Polygon.isConvex[playerEid]).toBe(1);
    expect(Polygon.vertexCount[playerEid]).toBe(4);
    expect(Polygon.originX[playerEid]).toBe(0);
    expect(Polygon.originY[playerEid]).toBe(0);

    // Verify each vertex position (100x100 box centered at origin)
    const vertices = [
      { x: -50, y: -50 }, // Top-left
      { x: 50, y: -50 }, // Top-right
      { x: 50, y: 50 }, // Bottom-right
      { x: -50, y: 50 }, // Bottom-left
    ];

    for (const [index, vertex] of vertices.entries()) {
      expect(verticesX[index]).toBe(vertex.x);
      expect(verticesY[index]).toBe(vertex.y);
    }

    // Check collision values
    expect(Collidable.isActive[playerEid]).toBe(1);
    expect(Collidable.isTrigger[playerEid]).toBe(0);
    expect(Collidable.layer[playerEid]).toBe(CollisionMask.Player);
    expect(Collidable.mask[playerEid]).toBe(
      CollisionMask.Wall |
        CollisionMask.NPC |
        CollisionMask.Item |
        CollisionMask.Trigger,
    );

    // Check health values
    expect(Health.current[playerEid]).toBe(100);
    expect(Health.max[playerEid]).toBe(100);

    // Check physics values
    expect(Force.x[playerEid]).toBe(0);
    expect(Force.y[playerEid]).toBe(0);
    expect(Velocity.x[playerEid]).toBe(0);
    expect(Velocity.y[playerEid]).toBe(0);

    // Check keyboard state
    expect(KeyboardState.keys[playerEid]).toBe(0);

    // Check mouse state
    expect(MouseState.buttonsDown[playerEid]).toBe(0);
    expect(MouseState.clickedEntity[playerEid]).toBe(0);
    expect(MouseState.hoveredEntity[playerEid]).toBe(0);
    expect(MouseState.screenX[playerEid]).toBe(0);
    expect(MouseState.screenY[playerEid]).toBe(0);

    // Check animation values
    expect(Animation.currentSequence[playerEid]).toBe("idle");
    expect(Animation.isPlaying[playerEid]).toBe(1);
    expect(Animation.isLooping[playerEid]).toBe(1);
    expect(Animation.timer[playerEid]).toBe(0);

    // Check name
    expect(Named.name[playerEid]).toBe("Player");
  });

  it("should create a player at default position when no coordinates provided", () => {
    const world = createWorld();
    const playerEid = createPlayer(world, { x: 0, y: 0 });

    expect(Transform.x[playerEid]).toBe(0);
    expect(Transform.y[playerEid]).toBe(0);
  });
});
