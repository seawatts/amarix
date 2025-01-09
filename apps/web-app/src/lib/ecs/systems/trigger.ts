import type { World } from "bitecs";
import { query } from "bitecs";

import {
  BoundingBox,
  Collidable,
  CurrentPlayer,
  Transform,
  TriggerZone,
} from "../components";

function checkOverlap(
  x1: number,
  y1: number,
  width1: number,
  height1: number,
  x2: number,
  y2: number,
  width2: number,
  height2: number,
): boolean {
  const left1 = x1 - width1 / 2;
  const right1 = x1 + width1 / 2;
  const top1 = y1 - height1 / 2;
  const bottom1 = y1 + height1 / 2;

  const left2 = x2 - width2 / 2;
  const right2 = x2 + width2 / 2;
  const top2 = y2 - height2 / 2;
  const bottom2 = y2 + height2 / 2;

  return left1 < right2 && right1 > left2 && top1 < bottom2 && bottom1 > top2;
}

export function createTriggerSystem() {
  return function triggerSystem(world: World) {
    // Get the current player
    const players = query(world, [CurrentPlayer, Transform, BoundingBox]);
    if (players.length === 0) return world;

    const playerEid = players[0];
    if (!playerEid) return world;
    const playerX = Transform.x[playerEid] ?? 0;
    const playerY = Transform.y[playerEid] ?? 0;
    const playerWidth = BoundingBox.width[playerEid] ?? 0;
    const playerHeight = BoundingBox.height[playerEid] ?? 0;

    // Get all trigger zones
    const triggerEntities = query(world, [
      Transform,
      BoundingBox,
      Collidable,
      TriggerZone,
    ]);

    const currentTime = performance.now();

    for (const triggerEid of triggerEntities) {
      // Skip if not a trigger type collider
      if (Collidable.isTrigger[triggerEid] !== 1) continue;

      const triggerX = Transform.x[triggerEid] ?? 0;
      const triggerY = Transform.y[triggerEid] ?? 0;
      const triggerWidth = BoundingBox.width[triggerEid] ?? 0;
      const triggerHeight = BoundingBox.height[triggerEid] ?? 0;

      // Check if player overlaps with trigger zone
      if (
        checkOverlap(
          playerX,
          playerY,
          playerWidth,
          playerHeight,
          triggerX,
          triggerY,
          triggerWidth,
          triggerHeight,
        )
      ) {
        const isActivated = TriggerZone.isActivated[triggerEid] === 1;
        const isRepeatable = TriggerZone.isRepeatable[triggerEid] === 1;
        const lastActivated = TriggerZone.lastActivatedTime[triggerEid] ?? 0;
        const cooldown = TriggerZone.cooldown[triggerEid] ?? 0;

        // Skip if already activated and not repeatable
        if (isActivated && !isRepeatable) continue;

        // Skip if on cooldown
        if (isRepeatable && currentTime - lastActivated < cooldown) continue;

        // Get trigger type and action
        const triggerType = TriggerZone.type[triggerEid] ?? "";
        const actionId = TriggerZone.actionId[triggerEid] ?? 0;

        // Handle different trigger types
        switch (triggerType) {
          case "quest": {
            console.log(`Starting quest ${actionId}`);
            break;
          }
          case "battle": {
            console.log(`Starting battle ${actionId}`);
            break;
          }
          case "dialog": {
            console.log(`Starting dialog ${actionId}`);
            break;
          }
          case "checkpoint": {
            console.log(`Activating checkpoint ${actionId}`);
            break;
          }
          default: {
            console.warn(`Unknown trigger type: ${triggerType}`);
            return world;
          }
        }

        // Update trigger state
        TriggerZone.isActivated[triggerEid] = 1;
        TriggerZone.lastActivatedTime[triggerEid] = currentTime;
      }
    }

    return world;
  };
}
