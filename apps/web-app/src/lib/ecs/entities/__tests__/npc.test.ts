import { createWorld, query } from "bitecs";
import { describe, expect, it } from "vitest";

import {
  Acceleration,
  Animation,
  BattleState,
  Clickable,
  Collidable,
  CollisionMask,
  Debug,
  Force,
  Gravity,
  Health,
  HostileNPC,
  InBattle,
  Movement,
  Named,
  NPC,
  Polygon,
  RigidBody,
  Script,
  Sound,
  Sprite,
  Transform,
  Velocity,
} from "../../components";
import { createHostileNPC, createNPC } from "../npc";

describe("NPC Entity", () => {
  it("should create a regular NPC with all required components", () => {
    const world = createWorld();
    const npcEid = createNPC(world, { x: 100, y: 200 });

    // Check if NPC entity has all required components
    const npcs = query(world, [
      Transform,
      Movement,
      NPC,
      Health,
      Polygon,
      RigidBody,
      Collidable,
      Clickable,
      Sprite,
      Animation,
      Sound,
      Script,
      Gravity,
      Acceleration,
      Velocity,
      Force,
      Named,
      Debug,
    ]);
    expect(npcs).toContain(npcEid);

    // Check transform values
    expect(Transform.x[npcEid]).toBe(100);
    expect(Transform.y[npcEid]).toBe(200);
    expect(Transform.rotation[npcEid]).toBe(0);
    expect(Transform.scaleX[npcEid]).toBe(1);
    expect(Transform.scaleY[npcEid]).toBe(1);

    // Check NPC values
    expect(NPC.eid[npcEid]).toBe(1);
    expect(Health.current[npcEid]).toBe(100);
    expect(Health.max[npcEid]).toBe(100);

    // Check physics values
    expect(RigidBody.mass[npcEid]).toBe(70);
    expect(RigidBody.friction[npcEid]).toBeCloseTo(0.2, 4);
    expect(RigidBody.restitution[npcEid]).toBeCloseTo(0.1, 4);
    expect(RigidBody.isStatic[npcEid]).toBe(0);
    expect(RigidBody.linearDamping[npcEid]).toBeCloseTo(0.9, 4);
    expect(RigidBody.angularDamping[npcEid]).toBeCloseTo(0.95, 4);

    // Check collision values
    expect(Collidable.isActive[npcEid]).toBe(1);
    expect(Collidable.isTrigger[npcEid]).toBe(0);
    expect(Collidable.layer[npcEid]).toBe(CollisionMask.NPC);
    expect(Collidable.mask[npcEid]).toBe(
      CollisionMask.Player | CollisionMask.Wall,
    );

    // Check animation values
    expect(Animation.currentSequence[npcEid]).toBe("idle");
    expect(Animation.isPlaying[npcEid]).toBe(1);
    expect(Animation.isLooping[npcEid]).toBe(1);

    // Check sound values
    expect(Sound.src[npcEid]).toBe("/sounds/npc-footstep.mp3");
    expect(Sound.isPlaying[npcEid]).toBe(0);
    expect(Sound.isLooping[npcEid]).toBe(0);
    expect(Sound.volume[npcEid]).toBe(0.5);
    expect(Sound.playbackRate[npcEid]).toBe(1);

    // Check script values
    expect(Script.isActive[npcEid]).toBe(1);
    expect(Script.scriptId[npcEid]).toBe(0);
    expect(Script.state[npcEid]).toBe(0);

    // Check name
    expect(Named.name[npcEid]).toBe("NPC");
  });

  it("should create a hostile NPC with additional components", () => {
    const world = createWorld();
    const npcEid = createHostileNPC(world, { x: 100, y: 200 });

    // Check if hostile NPC has additional components
    const hostileNpcs = query(world, [HostileNPC, BattleState, InBattle]);
    expect(hostileNpcs).toContain(npcEid);

    // Check hostile NPC values
    expect(HostileNPC.eid[npcEid]).toBe(1);
    expect(HostileNPC.isHostile[npcEid]).toBe(1);
    expect(BattleState.isActive[npcEid]).toBe(0);
    expect(BattleState.turn[npcEid]).toBe(0);
    expect(BattleState.enemyPosition.x[npcEid]).toBe(0);
    expect(BattleState.enemyPosition.y[npcEid]).toBe(0);
    expect(BattleState.playerPosition.x[npcEid]).toBe(0);
    expect(BattleState.playerPosition.y[npcEid]).toBe(0);
    expect(InBattle.eid[npcEid]).toBe(0);

    // Check name
    expect(Named.name[npcEid]).toBe("Hostile NPC");
  });

  it("should create an NPC with correct polygon vertices", () => {
    const world = createWorld();
    const npcEid = createNPC(world, { x: 0, y: 0 });

    // Check polygon values
    expect(Polygon.isConvex[npcEid]).toBe(1);
    expect(Polygon.vertexCount[npcEid]).toBe(4);
    expect(Polygon.originX[npcEid]).toBe(0);
    expect(Polygon.originY[npcEid]).toBe(0);

    // Check vertices (100x100 box centered at origin)
    const verticesX = Polygon.verticesX[npcEid] ?? [];
    const verticesY = Polygon.verticesY[npcEid] ?? [];

    // Verify each vertex position
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
  });
});
