import { createWorld, query } from "bitecs";
import { describe, expect, it } from "vitest";

import { Debug, Named, Scene } from "../../components";
import { createScene } from "../scene";

describe("Scene Entity", () => {
  it("should create a scene with all required components", () => {
    const world = createWorld();
    const sceneEid = createScene(world, { initialScene: "MENU" });

    // Check if scene entity has all required components
    const scenes = query(world, [Scene, Named, Debug]);
    expect(scenes).toContain(sceneEid);

    // Check scene values
    expect(Scene.current[0]).toBe("MENU");
    expect(Scene.isTransitioning[sceneEid]).toBe(0);
    expect(Scene.next[0]).toBe("");
    expect(Scene.transitionProgress[sceneEid]).toBe(0);

    // Check name
    expect(Named.name[sceneEid]).toBe("Scene Manager");
  });

  it("should create a scene with different initial scene", () => {
    const world = createWorld();
    const _sceneEid = createScene(world, { initialScene: "GAME" });

    expect(Scene.current[0]).toBe("GAME");
    expect(Scene.next[0]).toBe("");
  });
});
