import type { createWorld } from "bitecs";
import { query } from "bitecs";

import {
  BattleAction,
  BattleState,
  CurrentPlayer,
  KeyboardState,
  Movement,
  ValidActions,
} from "../components";
import { isKeyDown, KEY_CODES } from "../utils/keyboard";

const CELL_SIZE = 50;

interface ValidMove {
  x: number;
  y: number;
}

function handleBattleInput(
  world: ReturnType<typeof createWorld>,
  playerEid: number,
) {
  // Only handle input on player's turn
  if (BattleState.turn[playerEid] !== 0) return;

  const playerX = BattleState.playerPosition.x[playerEid] ?? 0;
  const playerY = BattleState.playerPosition.y[playerEid] ?? 0;
  const validMoves = (ValidActions.cells[playerEid] ?? []) as ValidMove[];

  // Check each movement key
  if (isKeyDown(playerEid, KEY_CODES.ARROW_LEFT)) {
    const targetX = playerX - CELL_SIZE;
    const targetY = playerY;
    if (
      validMoves.some(
        (move: ValidMove) => move.x === targetX && move.y === targetY,
      )
    ) {
      BattleAction.type[playerEid] = "move";
      BattleAction.targetX[playerEid] = targetX;
      BattleAction.targetY[playerEid] = targetY;
    }
  } else if (isKeyDown(playerEid, KEY_CODES.ARROW_RIGHT)) {
    const targetX = playerX + CELL_SIZE;
    const targetY = playerY;
    if (
      validMoves.some(
        (move: ValidMove) => move.x === targetX && move.y === targetY,
      )
    ) {
      BattleAction.type[playerEid] = "move";
      BattleAction.targetX[playerEid] = targetX;
      BattleAction.targetY[playerEid] = targetY;
    }
  } else if (isKeyDown(playerEid, KEY_CODES.ARROW_UP)) {
    const targetX = playerX;
    const targetY = playerY - CELL_SIZE;
    if (
      validMoves.some(
        (move: ValidMove) => move.x === targetX && move.y === targetY,
      )
    ) {
      BattleAction.type[playerEid] = "move";
      BattleAction.targetX[playerEid] = targetX;
      BattleAction.targetY[playerEid] = targetY;
    }
  } else if (isKeyDown(playerEid, KEY_CODES.ARROW_DOWN)) {
    const targetX = playerX;
    const targetY = playerY + CELL_SIZE;
    if (
      validMoves.some(
        (move: ValidMove) => move.x === targetX && move.y === targetY,
      )
    ) {
      BattleAction.type[playerEid] = "move";
      BattleAction.targetX[playerEid] = targetX;
      BattleAction.targetY[playerEid] = targetY;
    }
  }

  // Check for attack action
  if (
    isKeyDown(playerEid, KEY_CODES.SPACE) ||
    isKeyDown(playerEid, KEY_CODES.ENTER)
  ) {
    const attackMove = validMoves.find((move: ValidMove) => {
      // Find a valid move that's not the player's current position
      return move.x !== playerX || move.y !== playerY;
    });
    if (attackMove) {
      BattleAction.type[playerEid] = "attack";
      BattleAction.targetX[playerEid] = attackMove.x;
      BattleAction.targetY[playerEid] = attackMove.y;
    }
  }
}

function handleExplorationInput(
  world: ReturnType<typeof createWorld>,
  playerEid: number,
) {
  // Reset movement
  Movement.dx[playerEid] = 0;
  Movement.dy[playerEid] = 0;

  // Handle horizontal movement
  if (isKeyDown(playerEid, KEY_CODES.ARROW_LEFT)) {
    Movement.dx[playerEid] -= 1;
  }
  if (isKeyDown(playerEid, KEY_CODES.ARROW_RIGHT)) {
    Movement.dx[playerEid] += 1;
  }

  // Handle vertical movement
  if (isKeyDown(playerEid, KEY_CODES.ARROW_UP)) {
    Movement.dy[playerEid] -= 1;
  }
  if (isKeyDown(playerEid, KEY_CODES.ARROW_DOWN)) {
    Movement.dy[playerEid] += 1;
  }

  // Normalize diagonal movement
  if (Movement.dx[playerEid] !== 0 && Movement.dy[playerEid] !== 0) {
    const normalizer = Math.SQRT1_2; // 1/√2
    Movement.dx[playerEid] *= normalizer;
    Movement.dy[playerEid] *= normalizer;
  }
}

export function createKeyboardSystem() {
  return (world: ReturnType<typeof createWorld>) => {
    // Query for entities with both CurrentPlayer and InputState components
    const players = query(world, [CurrentPlayer, KeyboardState]);
    for (const playerEid of players) {
      if (BattleState.isActive[playerEid]) {
        handleBattleInput(world, playerEid);
      } else {
        handleExplorationInput(world, playerEid);
      }
    }
    return world;
  };
}
