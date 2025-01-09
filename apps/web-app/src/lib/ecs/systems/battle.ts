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
  Transform,
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
    const players = query(world, [Transform, Player, Movement]);
    const hostileNpcs = query(world, [Transform, NPC, HostileNPC]);
    const battling = query(world, [InBattle]);

    // Check for battle initiation
    if (battling.length === 0) {
      for (const playerEid of players) {
        const playerX = Transform.x[playerEid] ?? 0;
        const playerY = Transform.y[playerEid] ?? 0;

        for (const npcEid of hostileNpcs) {
          const npcX = Transform.x[npcEid] ?? 0;
          const npcY = Transform.y[npcEid] ?? 0;

          // Check if player and hostile NPC are in the same cell
          if (
            Math.abs(playerX - npcX) < CELL_SIZE &&
            Math.abs(playerY - npcY) < CELL_SIZE
          ) {
            // Initialize battle
            addComponent(world, playerEid, InBattle);
            addComponent(world, npcEid, InBattle);
            addComponent(world, playerEid, Health);
            addComponent(world, npcEid, Health);
            addComponent(world, playerEid, BattleAction);
            addComponent(world, playerEid, ValidActions);

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

            // Initialize battle state
            BattleState.isActive[playerEid] = 1;
            BattleState.turn[playerEid] = 0; // Player's turn first

            // Stop movement
            Movement.dx[playerEid] = 0;
            Movement.dy[playerEid] = 0;

            // Initialize valid actions
            ValidActions.cells[playerEid] = getValidMoves(
              BattleState.playerPosition.x[playerEid],
              BattleState.playerPosition.y[playerEid],
            );
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

          // Get valid moves and attack positions
          const validMoves = getValidMoves(playerXPos, playerYPos);
          const attackPositions = isAdjacent(
            playerXPos,
            playerYPos,
            enemyXPos,
            enemyYPos,
          )
            ? [{ x: enemyXPos, y: enemyYPos }]
            : [];

          // Store valid actions
          ValidActions.cells[playerEid] = [...validMoves, ...attackPositions];

          // Handle player action if one was chosen
          const actionType = BattleAction.type[playerEid];
          if (actionType) {
            const targetX = BattleAction.targetX[playerEid] ?? 0;
            const targetY = BattleAction.targetY[playerEid] ?? 0;

            if (actionType === "move") {
              // Verify move is valid
              const isValidMove = validMoves.some(
                (move) => move.x === targetX && move.y === targetY,
              );
              if (isValidMove) {
                BattleState.playerPosition.x[playerEid] = targetX;
                BattleState.playerPosition.y[playerEid] = targetY;
              }
            } else if (actionType === "attack") {
              // Verify attack is valid
              const isValidAttack = attackPositions.some(
                (pos) => pos.x === targetX && pos.y === targetY,
              );
              if (isValidAttack) {
                Health.current[enemyEid] =
                  (Health.current[enemyEid] ?? INITIAL_HEALTH) - ATTACK_DAMAGE;
              }
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
            Health.current[playerEid] =
              (Health.current[playerEid] ?? INITIAL_HEALTH) - ATTACK_DAMAGE;
          } else {
            // Move towards player
            const moves = getValidMoves(enemyXPos, enemyYPos);
            if (moves.length > 0) {
              // Choose move that gets closer to player
              const firstMove = moves[0];
              if (!firstMove) return world;

              let bestMove = firstMove;
              let bestDistance =
                Math.abs(bestMove.x - playerXPos) +
                Math.abs(bestMove.y - playerYPos);

              for (let index = 1; index < moves.length; index++) {
                const move = moves[index];
                if (!move) continue;

                const distance =
                  Math.abs(move.x - playerXPos) + Math.abs(move.y - playerYPos);
                if (distance < bestDistance) {
                  bestMove = move;
                  bestDistance = distance;
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
          (Health.current[playerEid] ?? INITIAL_HEALTH) <= 0 ||
          (Health.current[enemyEid] ?? INITIAL_HEALTH) <= 0
        ) {
          // Remove battle components
          removeComponent(world, playerEid, InBattle);
          removeComponent(world, enemyEid, InBattle);
          BattleState.isActive[playerEid] = 0;

          // If enemy died, remove them
          if ((Health.current[enemyEid] ?? INITIAL_HEALTH) <= 0) {
            removeComponent(world, enemyEid, HostileNPC);
            removeComponent(world, enemyEid, NPC);
          }
        }
      }
    }

    return world;
  };
}
