import { addEntity, createWorld } from "bitecs";
import { describe, expect, it } from "vitest";

import { KeyboardState } from "../../components";
import {
  clearKeyDown,
  getMovementInput,
  isCommandKeyDown,
  isKeyDown,
  setKeyDown,
} from "../keyboard";

describe("Keyboard Utils", () => {
  describe("Key State Management", () => {
    it("should manage key states correctly", () => {
      const world = createWorld();
      const playerEid = addEntity(world);
      KeyboardState.keys[playerEid] = 0;

      // Initially no keys are pressed
      expect(isKeyDown(playerEid, "ArrowUp")).toBe(false);
      expect(isKeyDown(playerEid, "KeyW")).toBe(false);

      // Press some keys
      setKeyDown(playerEid, "ArrowUp");
      expect(isKeyDown(playerEid, "ArrowUp")).toBe(true);
      expect(isKeyDown(playerEid, "KeyW")).toBe(true); // Same bit position

      setKeyDown(playerEid, "ArrowRight");
      expect(isKeyDown(playerEid, "ArrowRight")).toBe(true);
      expect(isKeyDown(playerEid, "KeyD")).toBe(true); // Same bit position

      // Clear a key
      clearKeyDown(playerEid, "ArrowUp");
      expect(isKeyDown(playerEid, "ArrowUp")).toBe(false);
      expect(isKeyDown(playerEid, "KeyW")).toBe(false);
      expect(isKeyDown(playerEid, "ArrowRight")).toBe(true); // Still pressed
    });

    it("should handle invalid key codes", () => {
      const world = createWorld();
      const playerEid = addEntity(world);
      KeyboardState.keys[playerEid] = 0;

      expect(isKeyDown(playerEid, "InvalidKey")).toBe(false);
      setKeyDown(playerEid, "InvalidKey"); // Should not throw
      clearKeyDown(playerEid, "InvalidKey"); // Should not throw
    });

    it("should handle undefined keyboard state", () => {
      const world = createWorld();
      const playerEid = addEntity(world);
      // Don't initialize KeyboardState.keys[playerEid]

      expect(isKeyDown(playerEid, "ArrowUp")).toBe(false);
      setKeyDown(playerEid, "ArrowUp"); // Should not throw
      clearKeyDown(playerEid, "ArrowUp"); // Should not throw
    });
  });

  describe("Movement Input", () => {
    it("should calculate movement input correctly", () => {
      const world = createWorld();
      const playerEid = addEntity(world);
      KeyboardState.keys[playerEid] = 0;

      // No movement
      expect(getMovementInput(playerEid)).toEqual({ dx: 0, dy: 0 });

      // Move right
      setKeyDown(playerEid, "ArrowRight");
      expect(getMovementInput(playerEid)).toEqual({ dx: 1, dy: 0 });

      // Move right and down
      setKeyDown(playerEid, "ArrowDown");
      expect(getMovementInput(playerEid)).toEqual({ dx: 1, dy: 1 });

      // Move left and down (left cancels right)
      setKeyDown(playerEid, "ArrowLeft");
      expect(getMovementInput(playerEid)).toEqual({ dx: 0, dy: 1 });

      // Move up and down (cancels out)
      clearKeyDown(playerEid, "ArrowLeft");
      clearKeyDown(playerEid, "ArrowRight");
      setKeyDown(playerEid, "KeyW");
      expect(getMovementInput(playerEid)).toEqual({ dx: 0, dy: 0 });
    });
  });

  describe("Command Key", () => {
    it("should detect command key state", () => {
      const world = createWorld();
      const playerEid = addEntity(world);
      KeyboardState.keys[playerEid] = 0;

      expect(isCommandKeyDown(playerEid)).toBe(false);

      setKeyDown(playerEid, "MetaLeft");
      expect(isCommandKeyDown(playerEid)).toBe(true);

      clearKeyDown(playerEid, "MetaLeft");
      expect(isCommandKeyDown(playerEid)).toBe(false);

      setKeyDown(playerEid, "MetaRight");
      expect(isCommandKeyDown(playerEid)).toBe(true);
    });
  });
});
