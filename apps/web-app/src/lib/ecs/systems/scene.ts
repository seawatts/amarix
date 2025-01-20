import { addComponent, addEntity, query } from "bitecs";

import type { World } from "../types";
import { Scene } from "../components";

// Scene definition
interface SceneConfig {
  // Called when the scene is initialized
  onEnter?: (world: World, data?: unknown) => void;
  // Called when the scene is updated
  onUpdate?: (world: World, data?: unknown) => void;
  // Called when the scene is exited
  onExit?: (world: World, data?: unknown) => void;
  // Transition duration in milliseconds
  transitionDuration?: number;
}

// Scene registry
const sceneRegistry = new Map<string, SceneConfig>();

// Register a new scene
export function registerScene(name: string, config: SceneConfig) {
  sceneRegistry.set(name, config);
}

// Change to a new scene
export function changeScene(
  world: World,
  sceneName: string,
  data?: Record<string, unknown>,
  transitionDuration = 500,
) {
  const sceneEntities = query(world, [Scene]);
  const sceneEid = sceneEntities[0] ?? addEntity(world);

  if (sceneEntities.length === 0) {
    addComponent(world, sceneEid, Scene);
  }

  // Start transition - use index 0 for global state
  Scene.next[0] = sceneName;
  Scene.isTransitioning[sceneEid] = 1;
  Scene.transitionProgress[sceneEid] = 0;
  Scene.data[sceneEid] = data ?? {};
  Scene.transitionDuration[sceneEid] = transitionDuration;
}

// Create the scene system
export function createSceneSystem() {
  return function sceneSystem(world: World) {
    const entities = query(world, [Scene]);
    if (entities.length === 0) return world;

    const sceneEid = entities[0];
    if (typeof sceneEid !== "number") return world;

    const currentScene = Scene.current[0] ?? "";
    const nextScene = Scene.next[0] ?? "";
    const isTransitioning = Scene.isTransitioning[sceneEid] === 1;

    // Handle scene transition
    if (isTransitioning) {
      const progress = Scene.transitionProgress[sceneEid] ?? 0;
      const transitionDuration = Scene.transitionDuration[sceneEid] ?? 500;
      const nextProgress = Math.min(
        1,
        progress + 1000 / 60 / transitionDuration,
      ); // Assuming 60fps
      Scene.transitionProgress[sceneEid] = nextProgress;

      // Complete transition
      if (nextProgress >= 1) {
        // Exit current scene
        if (currentScene) {
          const currentConfig = sceneRegistry.get(currentScene);
          if (currentConfig?.onExit) {
            currentConfig.onExit(world, Scene.data[sceneEid]);
          }
        }

        // Enter next scene
        const nextConfig = sceneRegistry.get(nextScene);
        if (nextConfig?.onEnter) {
          nextConfig.onEnter(world, Scene.data[sceneEid]);
        }

        Scene.current[0] = nextScene;
        Scene.next[0] = "";
        Scene.isTransitioning[sceneEid] = 0;
        Scene.transitionProgress[sceneEid] = 0;
      }
    }
    // Update current scene
    else if (currentScene) {
      const config = sceneRegistry.get(currentScene);
      if (config?.onUpdate) {
        config.onUpdate(world, Scene.data[sceneEid]);
      }
    }

    return world;
  };
}

// Clear scene registry (for testing)
export function clearSceneRegistry() {
  sceneRegistry.clear();
}

// Example scenes
export const SCENES = {
  BATTLE: "battle",
  GAME: "game",
  MENU: "menu",
} as const;

// Example scene registration
registerScene(SCENES.MENU, {
  onEnter: (_world) => {
    // Initialize menu entities
    console.log("Entering menu scene");
  },
  onExit: (_world) => {
    // Clean up menu entities
    console.log("Exiting menu scene");
  },
});

registerScene(SCENES.GAME, {
  onEnter: (_world) => {
    // Initialize game entities
    console.log("Entering game scene");
  },
  onExit: (_world) => {
    // Clean up game entities
    console.log("Exiting game scene");
  },
});

registerScene(SCENES.BATTLE, {
  onEnter: (_world, data) => {
    // Initialize battle entities with data
    console.log("Entering battle scene", data);
  },
  onExit: (_world) => {
    // Clean up battle entities
    console.log("Exiting battle scene");
  },
});
