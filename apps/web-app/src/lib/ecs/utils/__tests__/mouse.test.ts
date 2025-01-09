import { addEntity, createWorld } from "bitecs";
import { describe, expect, it } from "vitest";

import { MouseState } from "../../components";
import {
  clearMouseButtonDown,
  getCanvasCoordinates,
  getMouseState,
  isMouseButtonDown,
  MOUSE_BUTTONS,
  setClickedEntity,
  setHoveredEntity,
  setMouseButtonDown,
  updateMousePosition,
} from "../mouse";

describe("Mouse Utils", () => {
  describe("Canvas Coordinates", () => {
    it("should calculate canvas coordinates correctly", () => {
      const canvas = {
        getBoundingClientRect: () => ({
          height: 600,
          left: 100,
          top: 50,
          width: 800,
        }),
        height: 600,
        width: 800,
      } as HTMLCanvasElement;

      const event = {
        clientX: 300,
        clientY: 150,
      } as MouseEvent;

      const coords = getCanvasCoordinates(event, canvas);
      expect(coords).toEqual({ x: 200, y: 100 });
    });

    it("should handle scaled canvas", () => {
      const canvas = {
        getBoundingClientRect: () => ({
          // Canvas displayed at half size
          height: 300,

          left: 100,

          top: 50,
          width: 400,
        }),
        height: 600,
        width: 800,
      } as HTMLCanvasElement;

      const event = {
        clientX: 300,
        clientY: 150,
      } as MouseEvent;

      const coords = getCanvasCoordinates(event, canvas);
      expect(coords).toEqual({ x: 400, y: 200 }); // Coordinates scaled up
    });
  });

  describe("Mouse Button State", () => {
    it("should manage mouse button states correctly", () => {
      const world = createWorld();
      const playerEid = addEntity(world);
      MouseState.buttonsDown[playerEid] = 0;

      // Initially no buttons are pressed
      expect(isMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT)).toBe(false);
      expect(isMouseButtonDown(playerEid, MOUSE_BUTTONS.RIGHT)).toBe(false);

      // Press left button
      setMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT);
      expect(isMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT)).toBe(true);
      expect(isMouseButtonDown(playerEid, MOUSE_BUTTONS.RIGHT)).toBe(false);

      // Press right button
      setMouseButtonDown(playerEid, MOUSE_BUTTONS.RIGHT);
      expect(isMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT)).toBe(true);
      expect(isMouseButtonDown(playerEid, MOUSE_BUTTONS.RIGHT)).toBe(true);

      // Clear left button
      clearMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT);
      expect(isMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT)).toBe(false);
      expect(isMouseButtonDown(playerEid, MOUSE_BUTTONS.RIGHT)).toBe(true);
    });

    it("should handle undefined mouse state", () => {
      const world = createWorld();
      const playerEid = addEntity(world);
      // Don't initialize MouseState.buttonsDown[playerEid]

      expect(isMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT)).toBe(false);
      setMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT); // Should not throw
      clearMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT); // Should not throw
    });
  });

  describe("Mouse Position", () => {
    it("should update mouse position correctly", () => {
      const world = createWorld();
      const playerEid = addEntity(world);

      updateMousePosition(playerEid, 100, 200, 300, 400);

      expect(MouseState.screenX[playerEid]).toBe(100);
      expect(MouseState.screenY[playerEid]).toBe(200);
      expect(MouseState.worldX[playerEid]).toBe(300);
      expect(MouseState.worldY[playerEid]).toBe(400);
    });
  });

  describe("Entity Interaction", () => {
    it("should manage entity hover and click states", () => {
      const world = createWorld();
      const playerEid = addEntity(world);
      const entityId = 42;

      setHoveredEntity(playerEid, entityId);
      expect(MouseState.hoveredEntity[playerEid]).toBe(entityId);

      setClickedEntity(playerEid, entityId);
      expect(MouseState.clickedEntity[playerEid]).toBe(entityId);
    });
  });

  describe("Mouse State", () => {
    it("should get complete mouse state", () => {
      const world = createWorld();
      const playerEid = addEntity(world);

      // Setup initial state
      MouseState.buttonsDown[playerEid] = 0;
      updateMousePosition(playerEid, 100, 200, 300, 400);
      setHoveredEntity(playerEid, 42);
      setClickedEntity(playerEid, 43);
      setMouseButtonDown(playerEid, MOUSE_BUTTONS.LEFT);

      const state = getMouseState(playerEid);
      expect(state).toEqual({
        buttons: {
          left: true,
          middle: false,
          right: false,
        },
        clickedEntity: 43,
        hoveredEntity: 42,
        position: {
          screen: {
            x: 100,
            y: 200,
          },
          world: {
            x: 300,
            y: 400,
          },
        },
      });
    });

    it("should handle undefined state values", () => {
      const world = createWorld();
      const playerEid = addEntity(world);
      // Don't initialize any state

      const state = getMouseState(playerEid);
      expect(state).toEqual({
        buttons: {
          left: false,
          middle: false,
          right: false,
        },
        clickedEntity: 0,
        hoveredEntity: 0,
        position: {
          screen: {
            x: 0,
            y: 0,
          },
          world: {
            x: 0,
            y: 0,
          },
        },
      });
    });
  });
});
