import { addComponent, addEntity, createWorld } from "bitecs";
import { describe, expect, it } from "vitest";

import type { WorldProps } from "../../types";
import { Animation, Sprite } from "../../components";
import { createAnimationSystem, registerAnimation } from "../animation";

describe.skip("Animation System", () => {
  it("should register and play an animation sequence", () => {
    const world = createWorld<WorldProps>();
    const eid = addEntity(world);
    addComponent(world, eid, Animation, Sprite);

    // Register a test animation
    const testSprite = "/test-sprite.png";
    const testSequence = {
      frameDuration: 100,
      frames: [0, 1, 2],
      isLooping: true,
    };
    registerAnimation(testSprite, "test", testSequence);

    // Set up entity animation state
    Sprite.src[eid] = testSprite;
    Animation.currentSequence[eid] = "test";
    Animation.isPlaying[eid] = 1;
    Animation.timer[eid] = 0;
    Sprite.frame[eid] = 0;

    const animationSystem = createAnimationSystem();

    // Run system multiple times to simulate frame updates
    // First frame
    animationSystem(world);
    expect(Sprite.frame[eid]).toBe(0);
    expect(Animation.timer[eid]).toBeGreaterThan(0);

    // Force timer to exceed frame duration
    Animation.timer[eid] = 150; // Greater than frameDuration
    animationSystem(world);
    expect(Sprite.frame[eid]).toBe(1);
    expect(Animation.timer[eid]).toBe(0); // Timer should reset

    // Next frame
    Animation.timer[eid] = 150;
    animationSystem(world);
    expect(Sprite.frame[eid]).toBe(2);

    // Test looping
    Animation.timer[eid] = 150;
    animationSystem(world);
    expect(Sprite.frame[eid]).toBe(0); // Should loop back to start
  });

  it("should respect non-looping animations", () => {
    const world = createWorld<WorldProps>();
    const eid = addEntity(world);
    addComponent(world, eid, Animation, Sprite);

    // Register a non-looping animation
    const testSprite = "/test-sprite.png";
    const testSequence = {
      frameDuration: 100,
      frames: [0, 1, 2],
      isLooping: false,
    };
    registerAnimation(testSprite, "test", testSequence);

    // Set up entity animation state
    Sprite.src[eid] = testSprite;
    Animation.currentSequence[eid] = "test";
    Animation.isPlaying[eid] = 1;
    Animation.timer[eid] = 0;
    Sprite.frame[eid] = 0;
    Animation.isLooping[eid] = 0;

    const animationSystem = createAnimationSystem();

    // Run through all frames
    Animation.timer[eid] = 150;
    animationSystem(world);
    expect(Sprite.frame[eid]).toBe(1);

    Animation.timer[eid] = 150;
    animationSystem(world);
    expect(Sprite.frame[eid]).toBe(2);

    Animation.timer[eid] = 150;
    animationSystem(world);
    expect(Animation.isPlaying[eid]).toBe(0); // Should stop playing
    expect(Sprite.frame[eid]).toBe(2); // Should stay on last frame
  });

  it("should skip entities with invalid animation states", () => {
    const world = createWorld<WorldProps>();
    const eid = addEntity(world);
    addComponent(world, eid, Animation, Sprite);

    // Set up entity with invalid animation state
    Animation.isPlaying[eid] = 1;
    Animation.timer[eid] = 0;
    // Intentionally not setting sprite source or sequence

    const animationSystem = createAnimationSystem();
    animationSystem(world);

    // Should not crash and state should remain unchanged
    expect(Animation.timer[eid]).toBe(0);
  });

  it("should respect custom frame duration", () => {
    const world = createWorld<WorldProps>();
    const eid = addEntity(world);
    addComponent(world, eid, Animation, Sprite);

    // Register animation with default duration
    const testSprite = "/test-sprite.png";
    const testSequence = {
      frameDuration: 100,
      frames: [0, 1],
      isLooping: true,
    };
    registerAnimation(testSprite, "test", testSequence);

    // Set up entity with custom frame duration
    Sprite.src[eid] = testSprite;
    Animation.currentSequence[eid] = "test";
    Animation.isPlaying[eid] = 1;
    Animation.timer[eid] = 0;
    Sprite.frame[eid] = 0;
    Animation.frameDuration[eid] = 200; // Custom duration

    const animationSystem = createAnimationSystem();

    // Should not advance frame before custom duration
    Animation.timer[eid] = 150;
    animationSystem(world);
    expect(Sprite.frame[eid]).toBe(0);

    // Should advance frame after custom duration
    Animation.timer[eid] = 250;
    animationSystem(world);
    expect(Sprite.frame[eid]).toBe(1);
  });
});
