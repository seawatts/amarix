import type { createWorld } from "bitecs";
import { query } from "bitecs";

import { Animation, Sprite } from "../components";

interface AnimationSequence {
  frames: number[];
  frameDuration: number;
  isLooping: boolean;
}

type AnimationMap = Record<string, AnimationSequence>;

export const animationRegistry: Record<string, AnimationMap> = {};

export function registerAnimation(
  spriteSource: string,
  sequenceName: string,
  sequence: AnimationSequence,
): void {
  if (!animationRegistry[spriteSource]) {
    animationRegistry[spriteSource] = {};
  }
  animationRegistry[spriteSource][sequenceName] = sequence;
}

function getAnimationSequence(
  spriteSource: string,
  sequenceName: string,
): AnimationSequence | undefined {
  const spriteAnimations = animationRegistry[spriteSource];
  if (!spriteAnimations || typeof spriteAnimations !== "object") {
    return undefined;
  }

  const sequence = spriteAnimations[sequenceName];
  if (!sequence || typeof sequence !== "object") {
    return undefined;
  }

  if (
    !Array.isArray(sequence.frames) ||
    typeof sequence.frameDuration !== "number"
  ) {
    return undefined;
  }

  return sequence;
}

export function createAnimationSystem() {
  return (world: ReturnType<typeof createWorld>, deltaTime: number) => {
    const entities = query(world, [Animation, Sprite]);

    for (const eid of entities) {
      // Skip if not playing
      if ((Animation.isPlaying[eid] ?? 0) !== 1) {
        Animation.timer[eid] = 0;
        continue;
      }

      // Get animation sequence
      const maybeSpriteSource = Sprite.src[eid];
      const maybeSequenceName = Animation.currentSequence[eid];

      if (
        typeof maybeSpriteSource !== "string" ||
        typeof maybeSequenceName !== "string" ||
        maybeSpriteSource === "" ||
        maybeSequenceName === ""
      ) {
        Animation.timer[eid] = 0;
        continue;
      }

      const sequence = getAnimationSequence(
        maybeSpriteSource,
        maybeSequenceName,
      );
      if (!sequence) {
        Animation.timer[eid] = 0;
        continue;
      }

      // Initialize timer if undefined
      if (Animation.timer[eid] === undefined) {
        Animation.timer[eid] = 0;
      }

      // Update timer
      Animation.timer[eid] = (Animation.timer[eid] ?? 0) + deltaTime * 1000;

      // Check if it's time for next frame
      if ((Animation.timer[eid] ?? 0) >= sequence.frameDuration) {
        // Get current frame index
        const currentFrame = Sprite.frame[eid] ?? 0;
        const frameIndex = sequence.frames.indexOf(currentFrame);
        const nextFrameIndex = frameIndex + 1;

        // Update frame
        if (nextFrameIndex < sequence.frames.length) {
          const nextFrame = sequence.frames[nextFrameIndex];
          if (typeof nextFrame === "number") {
            Sprite.frame[eid] = nextFrame;
          }
        } else if (sequence.isLooping) {
          // Loop back to first frame
          const firstFrame = sequence.frames[0];
          if (typeof firstFrame === "number") {
            Sprite.frame[eid] = firstFrame;
          }
        } else {
          // Stop animation if not looping
          Animation.isPlaying[eid] = 0;
        }

        // Reset timer
        Animation.timer[eid] = 0;
      }
    }

    return world;
  };
}
