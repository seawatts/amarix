import { beforeEach, describe, expect, it } from "vitest";

import { GlobalKeyboardState } from "../../components";
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
      // Initially no keys are pressed
      expect(isKeyDown("ArrowUp")).toBe(false);
      expect(isKeyDown("KeyW")).toBe(false);

      // Press some keys
      setKeyDown("ArrowUp");
      expect(isKeyDown("ArrowUp")).toBe(true);
      expect(isKeyDown("KeyW")).toBe(true); // Same bit position

      setKeyDown("ArrowRight");
      expect(isKeyDown("ArrowRight")).toBe(true);
      expect(isKeyDown("KeyD")).toBe(true); // Same bit position

      // Clear a key
      clearKeyDown("ArrowUp");
      expect(isKeyDown("ArrowUp")).toBe(false);
      expect(isKeyDown("KeyW")).toBe(false);
      expect(isKeyDown("ArrowRight")).toBe(true); // Still pressed
    });

    it("should handle invalid key codes", () => {
      expect(isKeyDown("InvalidKey")).toBe(false);
      setKeyDown("InvalidKey"); // Should not throw
      clearKeyDown("InvalidKey"); // Should not throw
    });
  });

  describe("Movement Input", () => {
    beforeEach(() => {
      // Reset keyboard state
      GlobalKeyboardState.keys = 0;
    });

    it("should calculate movement input correctly", () => {
      // No movement
      expect(getMovementInput()).toEqual({ dx: 0, dy: 0 });

      // Move right
      setKeyDown("ArrowRight");
      expect(getMovementInput()).toEqual({ dx: 1, dy: 0 });

      // Move right and down
      setKeyDown("ArrowDown");
      expect(getMovementInput()).toEqual({ dx: 1, dy: 1 });

      // Move left and down (left cancels right)
      setKeyDown("ArrowLeft");
      expect(getMovementInput()).toEqual({ dx: 0, dy: 1 });

      // Move up and down (cancels out)
      clearKeyDown("ArrowLeft");
      clearKeyDown("ArrowRight");
      setKeyDown("KeyW");
      expect(getMovementInput()).toEqual({ dx: 0, dy: 0 });
    });
  });

  describe("Command Key", () => {
    beforeEach(() => {
      // Reset keyboard state
      GlobalKeyboardState.keys = 0;
    });

    it("should detect command key state", () => {
      expect(isCommandKeyDown()).toBe(false);

      setKeyDown("MetaLeft");
      expect(isCommandKeyDown()).toBe(true);

      clearKeyDown("MetaLeft");
      expect(isCommandKeyDown()).toBe(false);

      setKeyDown("MetaRight");
      expect(isCommandKeyDown()).toBe(true);
    });
  });
});
