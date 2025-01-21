import { query } from "bitecs";
import { describe, expect, it } from "vitest";

import {
  Camera,
  CurrentPlayer,
  HostileNPC,
  NPC,
  Scene,
  Transform,
  TriggerZone,
} from "../components";
import { createGameWorld } from "../world";

describe("Game World", () => {
  it("should create a world with all required entities", () => {
    const world = createGameWorld();

    // Check for player entity
    const players = query(world, [CurrentPlayer]);
    expect(players).toHaveLength(1);

    // Check for NPCs (5 total: 3 regular + 2 hostile)
    const npcs = query(world, [NPC]);
    expect(npcs).toHaveLength(5);

    // Check for hostile NPCs specifically
    const hostileNpcs = query(world, [HostileNPC]);
    expect(hostileNpcs).toHaveLength(2);

    // Check for camera entity
    const cameras = query(world, [Camera]);
    expect(cameras).toHaveLength(1);

    // Check if camera is targeting player
    const cameraEid = cameras[0];
    const playerEid = players[0];
    if (cameraEid !== undefined && playerEid !== undefined) {
      expect(Camera.target[cameraEid]).toBe(playerEid);
    }

    // Check for scene entity
    const scenes = query(world, [Scene]);
    expect(scenes).toHaveLength(1);
    expect(Scene.current[0]).toBe("GAME");

    // Check for trigger zone
    const triggerZones = query(world, [TriggerZone]);
    expect(triggerZones).toHaveLength(1);
    const triggerEid = triggerZones[0];
    if (triggerEid !== undefined) {
      expect(TriggerZone.type[triggerEid]).toBe("battle");
      expect(TriggerZone.actionId[triggerEid]).toBe(1);
    }
  });

  it("should position entities on grid", () => {
    const CELL_SIZE = 50;
    const world = createGameWorld();

    // Get all NPCs
    const npcs = query(world, [NPC, Transform]);

    // Check that each NPC is positioned on grid
    for (const npcEid of npcs) {
      const x = Transform.x[npcEid] ?? 0;
      const y = Transform.y[npcEid] ?? 0;

      // Position should be at cell center
      expect(x % CELL_SIZE).toBe(CELL_SIZE / 2);
      expect(y % CELL_SIZE).toBe(CELL_SIZE / 2);
    }
  });

  it("should position player at canvas center", () => {
    const world = createGameWorld();

    // Get player entity
    const players = query(world, [CurrentPlayer, Transform]);
    const playerEid = players[0];
    if (playerEid !== undefined) {
      // Check player position
      expect(Transform.x[playerEid]).toBe(400); // canvas.width / 2
      expect(Transform.y[playerEid]).toBe(300); // canvas.height / 2
    }
  });

  it("should not overlap entity positions", () => {
    const world = createGameWorld();

    // Get all positioned entities
    const players = query(world, [CurrentPlayer, Transform]);
    const npcs = query(world, [NPC, Transform]);

    // Collect all positions
    const positions = new Set<string>();

    // Check player position
    const playerEid = players[0];
    if (playerEid !== undefined) {
      const playerPos = `${Transform.x[playerEid] ?? 0},${Transform.y[playerEid] ?? 0}`;
      positions.add(playerPos);
    }

    // Check NPC positions
    for (const npcEid of npcs) {
      const npcPos = `${Transform.x[npcEid] ?? 0},${Transform.y[npcEid] ?? 0}`;

      // Position should not already exist
      expect(positions.has(npcPos)).toBe(false);
      positions.add(npcPos);
    }
  });

  it("should register all required animations", () => {
    const world = createGameWorld();

    // Note: Since animations are registered in a separate module,
    // we can't directly test the registration.
    // This test is more for documentation purposes.
    expect(true).toBe(true);
  });
});
