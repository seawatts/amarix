import type { World } from "bitecs";
import { query } from "bitecs";

import { Position, Sprite } from "../components";

// Cache for loaded sprite images
export const spriteCache = new Map<string, HTMLImageElement>();

// Load a sprite image and cache it
async function loadSprite(source: string): Promise<HTMLImageElement> {
  const cached = spriteCache.get(source);
  if (cached) return cached;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => {
      spriteCache.set(source, img);
      resolve(img);
    });
    img.addEventListener("error", reject);
    img.src = source;
  });
}

// Create the sprite system
export function createSpriteSystem() {
  // Track loaded sprites
  const loadedSprites = new Set<string>();

  return function spriteSystem(world: World) {
    const entities = query(world, [Position, Sprite]);

    // Load any new sprites
    for (const eid of entities) {
      const source = Sprite.src[eid];
      if (
        typeof source === "string" &&
        source.length > 0 &&
        !loadedSprites.has(source)
      ) {
        loadedSprites.add(source);
        void loadSprite(source).catch(console.error);
      }
    }

    return world;
  };
}
