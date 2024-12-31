import type { createWorld } from "bitecs";
import { addComponent, query, removeComponent } from "bitecs";

import {
  InteractionCooldown,
  Movement,
  NPC,
  NPCInteraction,
  Player,
  Position,
} from "../components";

interface WorldWithTime extends ReturnType<typeof createWorld> {
  time?: {
    delta: number;
  };
}

const INTERACTION_COOLDOWN = 0.5; // seconds

export function createNPCInteractionSystem() {
  return (world: WorldWithTime) => {
    const players = query(world, [Position, Player]);
    const npcs = query(world, [Position, NPC]);
    const interacting = query(world, [NPCInteraction]);

    // Process cooldowns and remove completed interactions
    for (const eid of interacting) {
      const timer = InteractionCooldown.timer[eid] ?? 0;
      if (timer > 0) {
        InteractionCooldown.timer[eid] = timer - (world.time?.delta ?? 0);
      } else {
        // Properly remove the interaction component
        removeComponent(world, eid, NPCInteraction, InteractionCooldown);
      }
    }

    // Check for player-NPC interactions
    for (const playerEid of players) {
      const playerX = Position.x[playerEid] ?? 0;
      const playerY = Position.y[playerEid] ?? 0;

      for (const npcEid of npcs) {
        const npcX = Position.x[npcEid] ?? 0;
        const npcY = Position.y[npcEid] ?? 0;

        // Check if player and NPC are in the same cell
        if (
          Math.abs(playerX - npcX) < 50 &&
          Math.abs(playerY - npcY) < 50 && // Only interact if not already interacting
          !interacting.includes(npcEid)
        ) {
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
    }

    return world;
  };
}
