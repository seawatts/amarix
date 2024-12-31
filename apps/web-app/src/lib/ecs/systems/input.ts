import type { createWorld } from "bitecs";

import {
  BattleAction,
  BattleState,
  InputState,
  Movement,
  ValidActions,
} from "../components";

const CELL_SIZE = 50;

interface ValidMove {
  x: number;
  y: number;
}

export function createInputSystem() {
  return (_world: ReturnType<typeof createWorld>) => {
    return {
      handleBattleInput: (playerEid: number, event: KeyboardEvent) => {
        // Track pressed key
        InputState.pressedKeys.add(event.key);

        // Only handle input on player's turn
        if (BattleState.turn[playerEid] !== 0) return;

        const playerX = BattleState.playerPosition.x[playerEid] ?? 0;
        const playerY = BattleState.playerPosition.y[playerEid] ?? 0;
        const validMoves = (ValidActions.cells[playerEid] ?? []) as ValidMove[];

        switch (event.key) {
          case "ArrowLeft": {
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
            break;
          }
          case "ArrowRight": {
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
            break;
          }
          case "ArrowUp": {
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
            break;
          }
          case "ArrowDown": {
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
            break;
          }
          case " ": // Space bar for attack
          case "Enter": {
            const attackMove = validMoves.find((move: ValidMove) => {
              // Find a valid move that's not the player's current position
              return move.x !== playerX || move.y !== playerY;
            });
            if (attackMove) {
              BattleAction.type[playerEid] = "attack";
              BattleAction.targetX[playerEid] = attackMove.x;
              BattleAction.targetY[playerEid] = attackMove.y;
            }
            break;
          }
        }
      },

      handleExplorationInput: (playerEid: number, event: KeyboardEvent) => {
        // Track pressed key
        InputState.pressedKeys.add(event.key);

        switch (event.key) {
          case "ArrowUp": {
            Movement.dy[playerEid] = -1;
            break;
          }
          case "ArrowDown": {
            Movement.dy[playerEid] = 1;
            break;
          }
          case "ArrowLeft": {
            Movement.dx[playerEid] = -1;
            break;
          }
          case "ArrowRight": {
            Movement.dx[playerEid] = 1;
            break;
          }
        }
      },

      handleKeyUp: (playerEid: number, event: KeyboardEvent) => {
        // Remove released key
        InputState.pressedKeys.delete(event.key);

        switch (event.key) {
          case "ArrowUp": {
            if (Movement.dy[playerEid] === -1) Movement.dy[playerEid] = 0;
            break;
          }
          case "ArrowDown": {
            if (Movement.dy[playerEid] === 1) Movement.dy[playerEid] = 0;
            break;
          }
          case "ArrowLeft": {
            if (Movement.dx[playerEid] === -1) Movement.dx[playerEid] = 0;
            break;
          }
          case "ArrowRight": {
            if (Movement.dx[playerEid] === 1) Movement.dx[playerEid] = 0;
            break;
          }
        }
      },
    };
  };
}
