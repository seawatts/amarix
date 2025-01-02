import { KeyboardState } from "../components";

// Key codes for different actions (shared across the app)
export const KEY_CODES = {
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  ARROW_UP: "ArrowUp",
  ENTER: "Enter",
  SPACE: "Space",
} as const;

// Map key codes to array indices for bit operations
const KEY_INDICES: Record<string, number> = {
  [KEY_CODES.ARROW_DOWN]: 0,
  [KEY_CODES.ARROW_LEFT]: 1,
  [KEY_CODES.ARROW_RIGHT]: 2,
  [KEY_CODES.ARROW_UP]: 3,
  [KEY_CODES.ENTER]: 4,
  [KEY_CODES.SPACE]: 5,
};

// Helper function to check if a key is pressed
export function isKeyDown(playerEid: number, code: string): boolean {
  const keyIndex = KEY_INDICES[code];
  if (keyIndex === undefined) return false;
  const value = KeyboardState.keys[playerEid];
  if (value === undefined) return false;
  return (value & (1 << keyIndex)) !== 0;
}

// Helper function to get all pressed keys
export function getPressedKeys(playerEid: number): string[] {
  const pressedKeys: string[] = [];

  if (isKeyDown(playerEid, KEY_CODES.ARROW_UP)) pressedKeys.push("↑");
  if (isKeyDown(playerEid, KEY_CODES.ARROW_DOWN)) pressedKeys.push("↓");
  if (isKeyDown(playerEid, KEY_CODES.ARROW_LEFT)) pressedKeys.push("←");
  if (isKeyDown(playerEid, KEY_CODES.ARROW_RIGHT)) pressedKeys.push("→");
  if (isKeyDown(playerEid, KEY_CODES.SPACE)) pressedKeys.push("Space");
  if (isKeyDown(playerEid, KEY_CODES.ENTER)) pressedKeys.push("Enter");

  return pressedKeys;
}

// Helper functions for setting key states
export function setKeyDown(playerEid: number, code: string) {
  const keyIndex = KEY_INDICES[code];
  if (keyIndex === undefined) return;
  const value = KeyboardState.keys[playerEid];
  if (value === undefined) return;
  KeyboardState.keys[playerEid] = value | (1 << keyIndex);
}

export function clearKeyDown(playerEid: number, code: string) {
  const keyIndex = KEY_INDICES[code];
  if (keyIndex === undefined) return;
  const value = KeyboardState.keys[playerEid];
  if (value === undefined) return;
  KeyboardState.keys[playerEid] = value & ~(1 << keyIndex);
}
