import { GlobalMouseState } from "../components";

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
export function isMouseButtonDown(button: number): boolean {
  return (GlobalMouseState.buttonsDown & (1 << button)) !== 0;
}

// Helper function to set mouse button state
export function setMouseButtonDown(button: number) {
  GlobalMouseState.buttonsDown |= 1 << button;
}

// Helper function to clear mouse button state
export function clearMouseButtonDown(button: number) {
  GlobalMouseState.buttonsDown &= ~(1 << button);
}

// Helper function to update mouse position
export function updateMousePosition(
  screenX: number,
  screenY: number,
  worldX: number,
  worldY: number,
) {
  GlobalMouseState.screenX = screenX;
  GlobalMouseState.screenY = screenY;
  GlobalMouseState.worldX = worldX;
  GlobalMouseState.worldY = worldY;
}

// Helper function to set hovered entity
export function setHoveredEntity(entityId: number) {
  GlobalMouseState.hoveredEntity = entityId;
}

// Helper function to set clicked entity
export function setClickedEntity(entityId: number) {
  GlobalMouseState.clickedEntity = entityId;
}

// Helper function to get mouse state for display
export function getMouseState() {
  const {
    buttonsDown,
    hoveredEntity,
    clickedEntity,
    screenX,
    screenY,
    worldX,
    worldY,
  } = GlobalMouseState;

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
        x: Math.round(screenX),
        y: Math.round(screenY),
      },
      world: {
        x: Math.round(worldX),
        y: Math.round(worldY),
      },
    },
  };
}
