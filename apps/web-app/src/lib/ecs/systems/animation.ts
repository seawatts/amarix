import type { World } from "bitecs";
import { query } from "bitecs";

import { Animation, Sprite } from "../components";

// Animation sequence definition
interface AnimationSequence {
  frames: number[];
  frameDuration: number;
  isLooping?: boolean;
}

// Animation registry to store animation sequences
type AnimationRegistry = Record<string, Record<string, AnimationSequence>>;

// Cache for animation sequences
const animationRegistry: AnimationRegistry = {};

// Register an animation sequence for a sprite
export function registerAnimation(
  spriteId: string,
  sequenceName: string,
  sequence: AnimationSequence,
) {
  if (!animationRegistry[spriteId]) {
    animationRegistry[spriteId] = {};
  }
  animationRegistry[spriteId][sequenceName] = sequence;
}

// Create the animation system
export function createAnimationSystem() {
  return function animationSystem(world: World) {
    const entities = query(world, [Animation, Sprite]);

    for (const eid of entities) {
      // Skip if animation is not playing
      if (!(Animation.isPlaying[eid] ?? 0)) continue;

      const spriteSource = Sprite.src[eid];
      const sequenceName = Animation.currentSequence[eid];

      if (
        typeof spriteSource !== "string" ||
        typeof sequenceName !== "string" ||
        !spriteSource ||
        !sequenceName
      )
        continue;

      const spriteAnimations = animationRegistry[spriteSource];
      if (!spriteAnimations) continue;

      const sequence = spriteAnimations[sequenceName];
      if (!sequence) continue;

      // Update animation timer
      const timer = (Animation.timer[eid] ?? 0) + 1000 / 60; // Add one frame at 60fps
      Animation.timer[eid] = timer;

      const frameDuration =
        Animation.frameDuration[eid] ?? sequence.frameDuration;
      if (timer >= frameDuration) {
        // Reset timer
        Animation.timer[eid] = 0;

        // Get current frame index
        const currentFrame = Sprite.frame[eid] ?? 0;
        const frameIndex = sequence.frames.indexOf(currentFrame);
        const nextFrameIndex = frameIndex + 1;

        if (nextFrameIndex >= sequence.frames.length) {
          // End of sequence
          if (Animation.isLooping[eid] ?? sequence.isLooping ?? false) {
            // Loop back to start
            Sprite.frame[eid] = sequence.frames[0] ?? 0;
          } else {
            // Stop animation
            Animation.isPlaying[eid] = 0;
          }
        } else {
          // Advance to next frame
          Sprite.frame[eid] = sequence.frames[nextFrameIndex] ?? 0;
        }
      }
    }

    return world;
  };
}
