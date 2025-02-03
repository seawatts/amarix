import { GlobalKeyboardState } from '../components'

// Key codes for movement
export const MOVEMENT_KEYS = {
  DOWN: ['ArrowDown', 'KeyS'],
  LEFT: ['ArrowLeft', 'KeyA'],
  RIGHT: ['ArrowRight', 'KeyD'],
  SPACE: ['Space'],
  UP: ['ArrowUp', 'KeyW'],
} as const

// Convert key code to bit position
function getKeyBit(code: string): number {
  switch (code) {
    case 'ArrowUp':
    case 'KeyW': {
      return 0
    }
    case 'ArrowDown':
    case 'KeyS': {
      return 1
    }
    case 'ArrowLeft':
    case 'KeyA': {
      return 2
    }
    case 'ArrowRight':
    case 'KeyD': {
      return 3
    }
    case 'Space': {
      return 32
    }
    case 'MetaLeft':
    case 'MetaRight': {
      return 33
    }
    default: {
      return -1
    }
  }
}

// Helper function to check if a key is pressed
export function isKeyDown(code: string): boolean {
  // First check the bit field for movement keys (for backward compatibility)
  const bit = getKeyBit(code)
  if (bit !== -1) {
    return (GlobalKeyboardState.keys & (1 << bit)) !== 0
  }
  // Then check the pressedKeys Set for all other keys
  return GlobalKeyboardState.pressedKeys.has(code)
}

// Helper function to set key state
export function setKeyDown(code: string) {
  // Update bit field for movement keys
  const bit = getKeyBit(code)
  if (bit !== -1) {
    GlobalKeyboardState.keys |= 1 << bit
  }
  // Update pressedKeys Set for all keys
  GlobalKeyboardState.pressedKeys.add(code)
}

// Helper function to clear key state
export function clearKeyDown(code: string) {
  // Update bit field for movement keys
  const bit = getKeyBit(code)
  if (bit !== -1) {
    GlobalKeyboardState.keys &= ~(1 << bit)
  }
  // Update pressedKeys Set for all keys
  GlobalKeyboardState.pressedKeys.delete(code)
}

// Helper function to get movement input
export function getMovementInput(): {
  dx: number
  dy: number
} {
  const up = isKeyDown('ArrowUp') || isKeyDown('KeyW')
  const down = isKeyDown('ArrowDown') || isKeyDown('KeyS')
  const left = isKeyDown('ArrowLeft') || isKeyDown('KeyA')
  const right = isKeyDown('ArrowRight') || isKeyDown('KeyD')

  const dx = (right ? 1 : 0) - (left ? 1 : 0)
  const dy = (down ? 1 : 0) - (up ? 1 : 0)

  return { dx, dy }
}

// Helper function to check if command key is pressed
export function isCommandKeyDown(): boolean {
  return isKeyDown('MetaLeft') || isKeyDown('MetaRight')
}

// Helper function to get all currently pressed keys
export function getPressedKeys(): string[] {
  return [...GlobalKeyboardState.pressedKeys]
}
