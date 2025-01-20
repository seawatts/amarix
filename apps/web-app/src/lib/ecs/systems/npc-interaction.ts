import { addComponent, query, removeComponent } from "bitecs";

import type { World } from "../types";
import {
  CollisionManifold,
  InteractionCooldown,
  Movement,
  NPC,
  NPCInteraction,
  Player,
  Transform,
} from "../components";

interface WorldWithTime extends World {
  time?: {
    delta: number;
  };
}

const INTERACTION_COOLDOWN = 0.5; // seconds
const INITIAL_DELAY = 1; // 1 second delay before interactions can start

export function createNPCInteractionSystem() {
  let systemStartTime = 0;
  let isInitialized = false;

  return (world: WorldWithTime) => {
    // Initialize start time on first run
    if (!isInitialized) {
      systemStartTime = Date.now();
      isInitialized = true;
    }

    // Don't process interactions during initial delay
    if (Date.now() - systemStartTime < INITIAL_DELAY * 1000) {
    }

    const players = query(world, [Transform, Player]);
    const npcs = query(world, [Transform, NPC]);
    const interacting = query(world, [NPCInteraction]);
    const collisions = query(world, [CollisionManifold]);

    // Process cooldowns and remove completed interactions
    for (const eid of interacting) {
      const timer = InteractionCooldown.timer[eid] ?? 0;
      if (timer > 0) {
        InteractionCooldown.timer[eid] = timer - (world.time?.delta ?? 0);
      } else {
        removeComponent(world, eid, NPCInteraction, InteractionCooldown);
      }
    }

    // Check for player-NPC collisions
    for (const collisionEid of collisions) {
      const entity1 = CollisionManifold.entity1[collisionEid] ?? 0;
      const entity2 = CollisionManifold.entity2[collisionEid] ?? 0;

      // Find player and NPC from collision pair
      let playerEid = 0;
      let npcEid = 0;

      if (players.includes(entity1) && npcs.includes(entity2)) {
        playerEid = entity1;
        npcEid = entity2;
      } else if (players.includes(entity2) && npcs.includes(entity1)) {
        playerEid = entity2;
        npcEid = entity1;
      }

      // If we found a player-NPC collision and NPC isn't already interacting
      if (playerEid && npcEid && !interacting.includes(npcEid)) {
        // Add interaction components
        addComponent(world, npcEid, NPCInteraction, InteractionCooldown);
        NPCInteraction.message[npcEid] =
          "Hello traveler! How can I help you today?";
        InteractionCooldown.timer[npcEid] = INTERACTION_COOLDOWN;

        // Stop player movement during interaction
        Movement.dx[playerEid] = 0;
        Movement.dy[playerEid] = 0;
      }
    }
  };
}
