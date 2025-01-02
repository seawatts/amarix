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
  const dpr = window.devicePixelRatio || 1;
  return {
    x: (event.clientX - rect.left) * dpr,
    y: (event.clientY - rect.top) * dpr,
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
  const value = MouseState.buttonsDown[playerEid];
  if (value === undefined) return;
  MouseState.buttonsDown[playerEid] = value | (1 << button);
}

// Helper function to clear mouse button state
export function clearMouseButtonDown(playerEid: number, button: number) {
  const value = MouseState.buttonsDown[playerEid];
  if (value === undefined) return;
  MouseState.buttonsDown[playerEid] = value & ~(1 << button);
}

// Helper function to update mouse position
export function updateMousePosition(playerEid: number, x: number, y: number) {
  MouseState.x[playerEid] = x;
  MouseState.y[playerEid] = y;
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
  return {
    buttons: {
      left: isMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT),
      middle: isMouseButtonDown(playerEid, MOUSE_BUTTONS.MIDDLE),
      right: isMouseButtonDown(playerEid, MOUSE_BUTTONS.RIGHT),
    },
    clickedEntity: MouseState.clickedEntity[playerEid] ?? 0,
    hoveredEntity: MouseState.hoveredEntity[playerEid] ?? 0,
    position: {
      x: Math.round(MouseState.x[playerEid] ?? 0),
      y: Math.round(MouseState.y[playerEid] ?? 0),
    },
  };
}
