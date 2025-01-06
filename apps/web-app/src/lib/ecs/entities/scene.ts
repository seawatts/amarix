import type { World } from "bitecs";
import { addComponent, addEntity } from "bitecs";

import { Named, Scene } from "../components";
import { SCENES } from "../systems/scene";

interface CreateSceneOptions {
  initialScene: keyof typeof SCENES;
}

export function createScene(world: World, options: CreateSceneOptions) {
  const sceneEid = addEntity(world);
  addComponent(world, sceneEid, Scene, Named);

  Scene.current[sceneEid] = SCENES[options.initialScene];
  Scene.next[sceneEid] = "";
  Scene.isTransitioning[sceneEid] = 0;
  Scene.transitionProgress[sceneEid] = 0;
  Scene.data[sceneEid] = {};

  // Set name
  Named.name[sceneEid] = `Scene ${options.initialScene}`;

  return sceneEid;
}
