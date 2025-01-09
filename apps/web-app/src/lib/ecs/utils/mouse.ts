import { MouseState } from "../components";

// Mouse button constants
export const MOUSE_BUTTONS = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
} as const;

// Helper function to get canvas-relative coordinates
export function getCanvasCoordinates(
  event: MouseEvent,
  canvas: HTMLCanvasElement,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

// Helper function to check if a mouse button is pressed
export function isMouseButtonDown(playerEid: number, button: number): boolean {
  const value = MouseState.buttonsDown[playerEid];
  if (value === undefined) return false;
  return (value & (1 << button)) !== 0;
}

// Helper function to set mouse button state
export function setMouseButtonDown(playerEid: number, button: number) {
  let value = MouseState.buttonsDown[playerEid];
  if (value === undefined) {
    value = 0;
    MouseState.buttonsDown[playerEid] = value;
  }
  MouseState.buttonsDown[playerEid] = value | (1 << button);
}

// Helper function to clear mouse button state
export function clearMouseButtonDown(playerEid: number, button: number) {
  let value = MouseState.buttonsDown[playerEid];
  if (value === undefined) {
    value = 0;
    MouseState.buttonsDown[playerEid] = value;
  }
  MouseState.buttonsDown[playerEid] = value & ~(1 << button);
}

// Helper function to update mouse position
export function updateMousePosition(
  playerEid: number,
  screenX: number,
  screenY: number,
  worldX: number,
  worldY: number,
) {
  MouseState.screenX[playerEid] = screenX;
  MouseState.screenY[playerEid] = screenY;
  MouseState.worldX[playerEid] = worldX;
  MouseState.worldY[playerEid] = worldY;
}

// Helper function to set hovered entity
export function setHoveredEntity(playerEid: number, entityId: number) {
  MouseState.hoveredEntity[playerEid] = entityId;
}

// Helper function to set clicked entity
export function setClickedEntity(playerEid: number, entityId: number) {
  MouseState.clickedEntity[playerEid] = entityId;
}

// Helper function to get mouse state for display
export function getMouseState(playerEid: number) {
  // Initialize state if undefined
  if (MouseState.buttonsDown[playerEid] === undefined) {
    MouseState.buttonsDown[playerEid] = 0;
  }
  if (MouseState.hoveredEntity[playerEid] === undefined) {
    MouseState.hoveredEntity[playerEid] = 0;
  }
  if (MouseState.clickedEntity[playerEid] === undefined) {
    MouseState.clickedEntity[playerEid] = 0;
  }
  if (MouseState.screenX[playerEid] === undefined) {
    MouseState.screenX[playerEid] = 0;
  }
  if (MouseState.screenY[playerEid] === undefined) {
    MouseState.screenY[playerEid] = 0;
  }
  if (MouseState.worldX[playerEid] === undefined) {
    MouseState.worldX[playerEid] = 0;
  }
  if (MouseState.worldY[playerEid] === undefined) {
    MouseState.worldY[playerEid] = 0;
  }

  // Get current values with fallbacks
  const buttonsDown = MouseState.buttonsDown[playerEid] ?? 0;
  const hoveredEntity = MouseState.hoveredEntity[playerEid] ?? 0;
  const clickedEntity = MouseState.clickedEntity[playerEid] ?? 0;
  const screenX = Math.round(MouseState.screenX[playerEid] ?? 0);
  const screenY = Math.round(MouseState.screenY[playerEid] ?? 0);
  const worldX = Math.round(MouseState.worldX[playerEid] ?? 0);
  const worldY = Math.round(MouseState.worldY[playerEid] ?? 0);

  return {
    buttons: {
      left: (buttonsDown & (1 << MOUSE_BUTTONS.LEFT)) !== 0,
      middle: (buttonsDown & (1 << MOUSE_BUTTONS.MIDDLE)) !== 0,
      right: (buttonsDown & (1 << MOUSE_BUTTONS.RIGHT)) !== 0,
    },
    clickedEntity,
    hoveredEntity,
    position: {
      screen: {
        x: screenX,
        y: screenY,
      },
      world: {
        x: worldX,
        y: worldY,
      },
    },
  };
}
