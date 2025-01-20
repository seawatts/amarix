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
    case "MetaLeft":
    case "MetaRight": {
      return 33;
    }
    default: {
      return -1;
    }
  }
}

// Helper function to check if a key is pressed
export function isKeyDown(eid: number, code: string): boolean {
  const bit = getKeyBit(code);
  if (bit === -1) return false;
  const value = KeyboardState.keys[eid];
  if (value === undefined) return false;
  return (value & (1 << bit)) !== 0;
}

// Helper function to set key state
export function setKeyDown(eid: number, code: string) {
  const bit = getKeyBit(code);
  if (bit === -1) return;
  const value = KeyboardState.keys[eid];
  if (value === undefined) return;
  KeyboardState.keys[eid] = value | (1 << bit);
}

// Helper function to clear key state
export function clearKeyDown(eid: number, code: string) {
  const bit = getKeyBit(code);
  if (bit === -1) return;
  const value = KeyboardState.keys[eid];
  if (value === undefined) return;
  KeyboardState.keys[eid] = value & ~(1 << bit);
}

// Helper function to get movement input
export function getMovementInput(eid: number): {
  dx: number;
  dy: number;
} {
  const up = isKeyDown(eid, "ArrowUp") || isKeyDown(eid, "KeyW");
  const down = isKeyDown(eid, "ArrowDown") || isKeyDown(eid, "KeyS");
  const left = isKeyDown(eid, "ArrowLeft") || isKeyDown(eid, "KeyA");
  const right = isKeyDown(eid, "ArrowRight") || isKeyDown(eid, "KeyD");

  const dx = (right ? 1 : 0) - (left ? 1 : 0);
  const dy = (down ? 1 : 0) - (up ? 1 : 0);

  return { dx, dy };
}

// Helper function to check if command key is pressed
export function isCommandKeyDown(eid: number): boolean {
  return isKeyDown(eid, "MetaLeft") || isKeyDown(eid, "MetaRight");
}
