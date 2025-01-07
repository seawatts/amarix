import { KeyboardState } from "../components";

// Key codes for movement
export const MOVEMENT_KEYS = {
  DOWN: ["ArrowDown", "KeyS"],
  LEFT: ["ArrowLeft", "KeyA"],
  RIGHT: ["ArrowRight", "KeyD"],
  SPACE: ["Space"],
  UP: ["ArrowUp", "KeyW"],
} as const;

// Convert key code to bit position
function getKeyBit(code: string): number {
  switch (code) {
    case "ArrowUp":
    case "KeyW": {
      return 0;
    }
    case "ArrowDown":
    case "KeyS": {
      return 1;
    }
    case "ArrowLeft":
    case "KeyA": {
      return 2;
    }
    case "ArrowRight":
    case "KeyD": {
      return 3;
    }
    case "Space": {
      return 32;
    }
    default: {
      return -1;
    }
  }
}

// Helper function to check if a key is pressed
export function isKeyDown(playerEid: number, code: string): boolean {
  const bit = getKeyBit(code);
  if (bit === -1) return false;
  const value = KeyboardState.keys[playerEid];
  if (value === undefined) return false;
  return (value & (1 << bit)) !== 0;
}

// Helper function to set key state
export function setKeyDown(playerEid: number, code: string) {
  const bit = getKeyBit(code);
  if (bit === -1) return;
  const value = KeyboardState.keys[playerEid];
  if (value === undefined) return;
  KeyboardState.keys[playerEid] = value | (1 << bit);
}

// Helper function to clear key state
export function clearKeyDown(playerEid: number, code: string) {
  const bit = getKeyBit(code);
  if (bit === -1) return;
  const value = KeyboardState.keys[playerEid];
  if (value === undefined) return;
  KeyboardState.keys[playerEid] = value & ~(1 << bit);
}

// Helper function to get movement input
export function getMovementInput(playerEid: number): {
  dx: number;
  dy: number;
} {
  const up = isKeyDown(playerEid, "ArrowUp") || isKeyDown(playerEid, "KeyW");
  const down =
    isKeyDown(playerEid, "ArrowDown") || isKeyDown(playerEid, "KeyS");
  const left =
    isKeyDown(playerEid, "ArrowLeft") || isKeyDown(playerEid, "KeyA");
  const right =
    isKeyDown(playerEid, "ArrowRight") || isKeyDown(playerEid, "KeyD");

  const dx = (right ? 1 : 0) - (left ? 1 : 0);
  const dy = (down ? 1 : 0) - (up ? 1 : 0);

  return { dx, dy };
}
