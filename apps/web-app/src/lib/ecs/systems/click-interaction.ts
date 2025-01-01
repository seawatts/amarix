import type { createWorld } from "bitecs";
import { addComponent, query } from "bitecs";

import {
  Clickable,
  HostileNPC,
  InBattle,
  Movement,
  NPC,
  NPCInteraction,
  Player,
  Position,
} from "../components";

const CELL_SIZE = 50;

interface Point {
  x: number;
  y: number;
}

function isPointInRect(point: Point, rectX: number, rectY: number): boolean {
  return (
    point.x >= rectX - CELL_SIZE / 2 &&
    point.x <= rectX + CELL_SIZE / 2 &&
    point.y >= rectY - CELL_SIZE / 2 &&
    point.y <= rectY + CELL_SIZE / 2
  );
}

export function createClickInteractionSystem() {
  return (world: ReturnType<typeof createWorld>) => {
    const npcs = query(world, [Position, NPC]);
    const players = query(world, [Position, Player]);

    return {
      handleClick: (mouseX: number, mouseY: number) => {
        // Only handle clicks if we're not in battle
        const inBattle = query(world, [InBattle]);
        if (inBattle.length > 0) return;

        const playerEid = players[0];
        if (!playerEid) return;

        // Check for clicking on NPCs
        for (const npcEid of npcs) {
          const x = Position.x[npcEid] ?? 0;
          const y = Position.y[npcEid] ?? 0;

          if (isPointInRect({ x: mouseX, y: mouseY }, x, y)) {
            // If it's a hostile NPC, we need to be close to initiate battle
            if (HostileNPC.eid[npcEid]) {
              const playerX = Position.x[playerEid] ?? 0;
              const playerY = Position.y[playerEid] ?? 0;
              const distance = Math.sqrt(
                Math.pow(x - playerX, 2) + Math.pow(y - playerY, 2),
              );

              if (distance <= CELL_SIZE * 2) {
                // Add battle components - this will be picked up by the battle system
                addComponent(world, playerEid, InBattle);
                addComponent(world, npcEid, InBattle);
              }
            } else {
              // For friendly NPCs, add interaction if we're close enough
              const playerX = Position.x[playerEid] ?? 0;
              const playerY = Position.y[playerEid] ?? 0;
              const distance = Math.sqrt(
                Math.pow(x - playerX, 2) + Math.pow(y - playerY, 2),
              );

              if (distance <= CELL_SIZE * 2) {
                addComponent(world, npcEid, NPCInteraction);
                NPCInteraction.message[npcEid] =
                  "Hello traveler! How can I help you today?";
                // Stop player movement during interaction
                Movement.dx[playerEid] = 0;
                Movement.dy[playerEid] = 0;
              }
            }
            break;
          }
        }
      },

      handleMouseMove: (mouseX: number, mouseY: number) => {
        // Reset all hover states
        for (const eid of npcs) {
          Clickable.isHovered[eid] = 0;
        }

        // Check for hovering over NPCs
        for (const npcEid of npcs) {
          const x = Position.x[npcEid] ?? 0;
          const y = Position.y[npcEid] ?? 0;

          if (isPointInRect({ x: mouseX, y: mouseY }, x, y)) {
            Clickable.isHovered[npcEid] = 1;
          }
        }
      },
    };
  };
}
