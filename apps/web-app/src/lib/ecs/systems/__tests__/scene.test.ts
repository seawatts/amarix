import { addComponent, addEntity, createWorld } from "bitecs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Scene } from "../../components";
import { changeScene, createSceneSystem, registerScene } from "../scene";

describe.skip("Scene System", () => {
  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, "log").mockImplementation(vi.fn());
  });

  it("should transition to new scene", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up scene entity
    addComponent(world, eid, Scene);
    Scene.current[0] = "menu";
    Scene.next[0] = "";
    Scene.isTransitioning[eid] = 0;
    Scene.transitionProgress[eid] = 0;

    // Register test scenes
    const onEnterMock = vi.fn();
    const onExitMock = vi.fn();
    registerScene("menu", {
      onExit: onExitMock,
    });
    registerScene("game", {
      onEnter: onEnterMock,
    });

    // Change scene
    changeScene(world, "game");

    // Run scene system until transition completes
    const sceneSystem = createSceneSystem();
    for (let index = 0; index < 60; index++) {
      // Run for 1 second at 60fps
      sceneSystem(world);
    }

    // Verify scene transition
    expect(Scene.current[0]).toBe("game");
    expect(Scene.next[0]).toBe("");
    expect(Scene.isTransitioning[eid]).toBe(0);
    expect(Scene.transitionProgress[eid]).toBe(0);
    expect(onExitMock).toHaveBeenCalled();
    expect(onEnterMock).toHaveBeenCalled();
  });

  it("should pass data between scenes", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up scene entity
    addComponent(world, eid, Scene);
    Scene.current[0] = "menu";
    Scene.next[0] = "";
    Scene.isTransitioning[eid] = 0;
    Scene.transitionProgress[eid] = 0;

    // Register test scenes
    const sceneData = { difficulty: "hard", level: 1 };
    const onEnterMock = vi.fn();
    registerScene("game", {
      onEnter: onEnterMock,
    });

    // Change scene with data
    changeScene(world, "game", sceneData);

    // Run scene system until transition completes
    const sceneSystem = createSceneSystem();
    for (let index = 0; index < 60; index++) {
      sceneSystem(world);
    }

    // Verify data was passed
    expect(onEnterMock).toHaveBeenCalledWith(world, sceneData);
  });

  it("should update current scene", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up scene entity
    addComponent(world, eid, Scene);
    Scene.current[0] = "game";
    Scene.next[0] = "";
    Scene.isTransitioning[eid] = 0;
    Scene.transitionProgress[eid] = 0;

    // Register test scene
    const onUpdateMock = vi.fn();
    registerScene("game", {
      onUpdate: onUpdateMock,
    });

    // Run scene system
    const sceneSystem = createSceneSystem();
    sceneSystem(world);

    // Verify update was called
    expect(onUpdateMock).toHaveBeenCalled();
  });

  it("should handle smooth transitions", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up scene entity
    addComponent(world, eid, Scene);
    Scene.current[0] = "menu";
    Scene.next[0] = "";
    Scene.isTransitioning[eid] = 0;
    Scene.transitionProgress[eid] = 0;

    // Change scene
    changeScene(world, "game");

    // Run scene system for partial transition
    const sceneSystem = createSceneSystem();
    for (let index = 0; index < 30; index++) {
      // Run for 0.5 seconds at 60fps
      sceneSystem(world);
    }

    // Verify transition is in progress
    expect(Scene.isTransitioning[eid]).toBe(1);
    expect(Scene.transitionProgress[eid]).toBeCloseTo(0.5, 1);
    expect(Scene.current[0]).toBe("menu");
    expect(Scene.next[0]).toBe("game");
  });

  it("should handle missing scene configurations", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up scene entity
    addComponent(world, eid, Scene);
    Scene.current[0] = "menu";
    Scene.next[0] = "";
    Scene.isTransitioning[eid] = 0;
    Scene.transitionProgress[eid] = 0;

    // Change to unregistered scene
    changeScene(world, "unknown");

    // Run scene system
    const sceneSystem = createSceneSystem();
    for (let index = 0; index < 60; index++) {
      sceneSystem(world);
    }

    // Verify transition completed without errors
    expect(Scene.current[0]).toBe("unknown");
    expect(Scene.isTransitioning[eid]).toBe(0);
  });
});
