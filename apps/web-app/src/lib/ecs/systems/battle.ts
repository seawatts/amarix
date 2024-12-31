import type { createWorld } from "bitecs";
import { addComponent, query, removeComponent } from "bitecs";

import {
  BattleAction,
  BattleState,
  Health,
  HostileNPC,
  InBattle,
  Movement,
  NPC,
  Player,
  Position,
  ValidActions,
} from "../components";

const BATTLE_GRID_SIZE = 10;
const CELL_SIZE = 50;
const INITIAL_HEALTH = 100;
const ATTACK_DAMAGE = 20;

function isAdjacent(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return (dx === CELL_SIZE && dy === 0) || (dx === 0 && dy === CELL_SIZE);
}

function getValidMoves(x: number, y: number) {
  const moves = [];
  const directions = [
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
  ];

  for (const { dx, dy } of directions) {
    const newX = x + dx * CELL_SIZE;
    const newY = y + dy * CELL_SIZE;

    // Check grid bounds
    if (
      newX >= 0 &&
      newX < BATTLE_GRID_SIZE * CELL_SIZE &&
      newY >= 0 &&
      newY < BATTLE_GRID_SIZE * CELL_SIZE
    ) {
      moves.push({ x: newX, y: newY });
    }
  }

  return moves;
}

export function createBattleSystem() {
  return (world: ReturnType<typeof createWorld>) => {
    const players = query(world, [Position, Player, Movement]);
    const hostileNpcs = query(world, [Position, NPC, HostileNPC]);
    const battling = query(world, [InBattle]);

    // Check for battle initiation
    if (battling.length === 0) {
      for (const playerEid of players) {
        const playerX = Position.x[playerEid] ?? 0;
        const playerY = Position.y[playerEid] ?? 0;

        for (const npcEid of hostileNpcs) {
          const npcX = Position.x[npcEid] ?? 0;
          const npcY = Position.y[npcEid] ?? 0;

          // Check if player and hostile NPC are in the same cell
          if (
            Math.abs(playerX - npcX) < CELL_SIZE &&
            Math.abs(playerY - npcY) < CELL_SIZE
          ) {
            // Initialize battle
            addComponent(world, playerEid, InBattle);
            addComponent(world, npcEid, InBattle);
            BattleState.isActive[playerEid] = 1;
            BattleState.turn[playerEid] = 0; // Player's turn first

            // Initialize health
            Health.current[playerEid] = INITIAL_HEALTH;
            Health.max[playerEid] = INITIAL_HEALTH;
            Health.current[npcEid] = INITIAL_HEALTH;
            Health.max[npcEid] = INITIAL_HEALTH;

            // Player starts at bottom center
            BattleState.playerPosition.x[playerEid] =
              (BATTLE_GRID_SIZE / 2) * CELL_SIZE;
            BattleState.playerPosition.y[playerEid] =
              (BATTLE_GRID_SIZE - 1) * CELL_SIZE;

            // Enemy starts at top center
            BattleState.enemyPosition.x[playerEid] =
              (BATTLE_GRID_SIZE / 2) * CELL_SIZE;
            BattleState.enemyPosition.y[playerEid] = 0;

            // Stop movement
            Movement.dx[playerEid] = 0;
            Movement.dy[playerEid] = 0;
          }
        }
      }
    } else {
      // Handle battle turns
      for (const playerEid of players) {
        if (!InBattle.eid[playerEid]) continue;

        const isPlayerTurn = BattleState.turn[playerEid] === 0;

        // Find the enemy
        const enemyEid = hostileNpcs.find((eid) => InBattle.eid[eid]);
        if (!enemyEid) continue;

        if (isPlayerTurn) {
          // Calculate valid moves for player
          const playerXPos = BattleState.playerPosition.x[playerEid] ?? 0;
          const playerYPos = BattleState.playerPosition.y[playerEid] ?? 0;
          const enemyXPos = BattleState.enemyPosition.x[playerEid] ?? 0;
          const enemyYPos = BattleState.enemyPosition.y[playerEid] ?? 0;

          ValidActions.cells[playerEid] = [
            ...getValidMoves(playerXPos, playerYPos),
            ...(isAdjacent(playerXPos, playerYPos, enemyXPos, enemyYPos)
              ? [{ x: enemyXPos, y: enemyYPos }]
              : []),
          ];

          // Handle player action if one was chosen
          const actionType = BattleAction.type[playerEid];
          if (actionType) {
            const targetX = BattleAction.targetX[playerEid] ?? 0;
            const targetY = BattleAction.targetY[playerEid] ?? 0;

            if (actionType === "move") {
              BattleState.playerPosition.x[playerEid] = targetX;
              BattleState.playerPosition.y[playerEid] = targetY;
            } else if (
              actionType === "attack" &&
              isAdjacent(playerXPos, playerYPos, enemyXPos, enemyYPos) &&
              Health.current[enemyEid] !== undefined
            ) {
              Health.current[enemyEid] -= ATTACK_DAMAGE;
            }

            // Clear action and switch turns
            BattleAction.type[playerEid] = "";
            BattleState.turn[playerEid] = 1;
          }
        } else {
          // Enemy turn - simple AI
          const playerXPos = BattleState.playerPosition.x[playerEid] ?? 0;
          const playerYPos = BattleState.playerPosition.y[playerEid] ?? 0;
          const enemyXPos = BattleState.enemyPosition.x[playerEid] ?? 0;
          const enemyYPos = BattleState.enemyPosition.y[playerEid] ?? 0;

          if (isAdjacent(playerXPos, playerYPos, enemyXPos, enemyYPos)) {
            // Attack if adjacent
            if (Health.current[playerEid] !== undefined) {
              Health.current[playerEid] -= ATTACK_DAMAGE;
            }
          } else {
            // Move towards player
            const moves = getValidMoves(enemyXPos, enemyYPos);
            if (moves.length > 0) {
              // Choose move that gets closer to player
              let bestMove = moves[0];
              if (!bestMove) return world;
              let bestDistribution =
                Math.abs(bestMove.x - playerXPos) +
                Math.abs(bestMove.y - playerYPos);

              for (let index = 1; index < moves.length; index++) {
                const move = moves[index];
                if (!move) continue;
                const distribution =
                  Math.abs(move.x - playerXPos) + Math.abs(move.y - playerYPos);
                if (distribution < bestDistribution) {
                  bestMove = move;
                  bestDistribution = distribution;
                }
              }

              BattleState.enemyPosition.x[playerEid] = bestMove.x;
              BattleState.enemyPosition.y[playerEid] = bestMove.y;
            }
          }

          // Switch back to player turn
          BattleState.turn[playerEid] = 0;
        }

        // Check for battle end
        if (
          (Health.current[playerEid] !== undefined &&
            Health.current[playerEid] <= 0) ||
          (Health.current[enemyEid] !== undefined &&
            Health.current[enemyEid] <= 0)
        ) {
          // Remove battle components
          removeComponent(world, playerEid, InBattle);
          removeComponent(world, enemyEid, InBattle);
          BattleState.isActive[playerEid] = 0;

          // If enemy died, remove them
          if (
            Health.current[enemyEid] !== undefined &&
            Health.current[enemyEid] <= 0
          ) {
            removeComponent(world, enemyEid, HostileNPC);
            removeComponent(world, enemyEid, NPC);
          }
        }
      }
    }

    return world;
  };
}
