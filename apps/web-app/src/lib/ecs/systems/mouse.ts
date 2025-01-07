import type { World } from "bitecs";
import { query } from "bitecs";

import {
  Clickable,
  CurrentPlayer,
  Hoverable,
  MouseState,
  Transform,
} from "../components";

const CELL_SIZE = 50;

export function createMouseSystem() {
  return function mouseSystem(world: World) {
    // Get current mouse position from MouseState
    const mouseEid = query(world, [CurrentPlayer, MouseState])[0];
    if (!mouseEid) return world;

    const mouseX = MouseState.x[mouseEid] ?? 0;
    const mouseY = MouseState.y[mouseEid] ?? 0;
    const buttonsDown = MouseState.buttonsDown[mouseEid] ?? 0;

    // Reset hover state
    MouseState.hoveredEntity[mouseEid] = 0;

    // Check for hover over hoverable entities
    const hoverables = query(world, [Transform, Hoverable]);
    for (const eid of hoverables) {
      const entityX = Transform.x[eid] ?? 0;
      const entityY = Transform.y[eid] ?? 0;

      // Check if mouse is within entity bounds
      const isHovered =
        mouseX >= entityX - CELL_SIZE / 2 &&
        mouseX <= entityX + CELL_SIZE / 2 &&
        mouseY >= entityY - CELL_SIZE / 2 &&
        mouseY <= entityY + CELL_SIZE / 2;

      Hoverable.isHovered[eid] = isHovered ? 1 : 0;

      // Update MouseState.hoveredEntity if entity is hovered
      if (isHovered) {
        MouseState.hoveredEntity[mouseEid] = eid;
      }
    }

    // Handle clicks on clickable entities
    const clickables = query(world, [Transform, Clickable]);
    for (const eid of clickables) {
      const entityX = Transform.x[eid] ?? 0;
      const entityY = Transform.y[eid] ?? 0;

      // Check if mouse is within entity bounds
      const isClicked =
        mouseX >= entityX - CELL_SIZE / 2 &&
        mouseX <= entityX + CELL_SIZE / 2 &&
        mouseY >= entityY - CELL_SIZE / 2 &&
        mouseY <= entityY + CELL_SIZE / 2;

      // Update clicked state based on mouse buttons
      if (isClicked && buttonsDown > 0) {
        Clickable.isClicked[eid] = 1;
        MouseState.clickedEntity[mouseEid] = eid;
      } else {
        Clickable.isClicked[eid] = 0;
        if (MouseState.clickedEntity[mouseEid] === eid) {
          MouseState.clickedEntity[mouseEid] = 0;
        }
      }
    }

    return world;
  };
}
