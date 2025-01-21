"use client";

import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { createAnimationSystem } from "~/lib/ecs/systems/animation";
import {
  createCameraSystem,
  handleGestureEnd,
  handleGestureStart,
  handleGestureUpdate,
} from "~/lib/ecs/systems/camera";
import { createDebugSystem } from "~/lib/ecs/systems/debug";
import { createKeyboardSystem } from "~/lib/ecs/systems/keyboard";
import { createMouseSystem } from "~/lib/ecs/systems/mouse";
import { createMovementSystem } from "~/lib/ecs/systems/movement";
import { createParticleSystem } from "~/lib/ecs/systems/particle";
import { createPhysicsSystem } from "~/lib/ecs/systems/physics";
import { createRenderSystem } from "~/lib/ecs/systems/render";
import { createSceneSystem } from "~/lib/ecs/systems/scene";
import { createScriptSystem } from "~/lib/ecs/systems/script";
import { createSoundSystem } from "~/lib/ecs/systems/sound";
import { createSpriteSystem } from "~/lib/ecs/systems/sprite";
import { createTriggerSystem } from "~/lib/ecs/systems/trigger";
import { clearKeyDown, setKeyDown } from "~/lib/ecs/utils/keyboard";
import {
  clearMouseButtonDown,
  getCanvasCoordinates,
  setMouseButtonDown,
  updateMousePosition,
} from "~/lib/ecs/utils/mouse";
import { createGameWorld } from "~/lib/ecs/world";
import { useDebugStore } from "~/providers/debug-provider";
import { useGame } from "~/providers/game-provider";

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initializeEngine = useGame((state) => state.initializeEngine);
  const [isInitialized, setIsInitialized] = useState(false);
  const debugStore = useDebugStore(useShallow((state) => state));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isInitialized) return;
    setIsInitialized(true);

    // Get the viewport size and set up canvas
    const rect = canvas.getBoundingClientRect();
    const viewportWidth = rect.width;
    const viewportHeight = rect.height;
    let isGesturing = false;
    let lastDistance = 0;
    let lastCenterX = 0;
    let lastCenterY = 0;

    // Set canvas size to match viewport but with higher resolution
    const RESOLUTION_SCALE = 2; // Increase this for higher resolution
    canvas.width = viewportWidth * RESOLUTION_SCALE;
    canvas.height = viewportHeight * RESOLUTION_SCALE;

    // Scale the canvas display size to match the viewport
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    // Get the context after setting size
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get canvas context");
    }

    // Clear the canvas to ensure clean state
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Initialize game engine
    const world = createGameWorld();
    // Initialize systems based on what's available
    const baseSystems = [
      // Input systems first for responsiveness
      { name: "keyboard", system: createKeyboardSystem() },
      { name: "physics", system: createPhysicsSystem() },
      { name: "trigger", system: createTriggerSystem() },
      { name: "script", system: createScriptSystem() },
      { name: "sprite", system: createSpriteSystem() },
      { name: "animation", system: createAnimationSystem() },
      { name: "sound", system: createSoundSystem() },
      { name: "particle", system: createParticleSystem() },
      { name: "scene", system: createSceneSystem() },
    ];

    const canvasBasedSystems = [
      { name: "mouse", system: createMouseSystem(canvas) },
      { name: "movement", system: createMovementSystem() },
      { name: "camera", system: createCameraSystem() },
      { name: "render", system: createRenderSystem(canvas) },
    ];

    const debugSystem = {
      isPaused: false,
      name: "debug",
      system: createDebugSystem(debugStore),
    };

    // world.systems =
    const gameEngine = initializeEngine({
      canvas,
      systems: [...baseSystems, ...canvasBasedSystems, debugSystem],
      world,
    });

    // Define keyboard handlers
    const handleKeyDown = (event: KeyboardEvent) => {
      setKeyDown(event.code);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      clearKeyDown(event.code);
    };

    // Define mouse handlers
    const handleMouseMove = (event: MouseEvent) => {
      if (!canvasRef.current) return;
      const { x, y } = getCanvasCoordinates(event, canvasRef.current);
      // Update mouse position in both screen and world coordinates
      // Since we don't have world coordinates yet, use screen coordinates
      updateMousePosition(x, y, x, y);
    };

    const handleMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      setMouseButtonDown(event.button);
    };

    const handleMouseUp = (event: MouseEvent) => {
      event.preventDefault();
      clearMouseButtonDown(event.button);
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    // Define gesture handlers
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        event.preventDefault();
        const cameraEid = gameEngine.getCameraEid();
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        if (!touch1 || !touch2) return;

        isGesturing = true;
        handleGestureStart(cameraEid);

        // Calculate initial gesture state
        lastDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );
        lastCenterX = (touch1.clientX + touch2.clientX) / 2;
        lastCenterY = (touch1.clientY + touch2.clientY) / 2;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isGesturing && event.touches.length === 2) {
        event.preventDefault();
        const cameraEid = gameEngine.getCameraEid();
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        if (!touch1 || !touch2) return;

        // Calculate new gesture state
        const newDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );
        const newCenterX = (touch1.clientX + touch2.clientX) / 2;
        const newCenterY = (touch1.clientY + touch2.clientY) / 2;

        // Calculate scale and translation
        const scale = newDistance / lastDistance;
        const translationX = newCenterX - lastCenterX;
        const translationY = newCenterY - lastCenterY;

        // Update gesture state
        handleGestureUpdate(cameraEid, scale, translationX, translationY);

        // Store current state for next frame
        lastDistance = newDistance;
        lastCenterX = newCenterX;
        lastCenterY = newCenterY;
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2 && isGesturing) {
        event.preventDefault();
        const cameraEid = gameEngine.getCameraEid();
        isGesturing = false;
        handleGestureEnd(cameraEid);
      }
    };

    // Add event listeners
    globalThis.addEventListener("keydown", handleKeyDown);
    globalThis.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("contextmenu", handleContextMenu);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchmove", handleTouchMove);
    canvas.addEventListener("touchend", handleTouchEnd);
    setIsInitialized(true);

    return () => {
      // Clean up event listeners
      // globalThis.removeEventListener("keydown", handleKeyDown);
      // globalThis.removeEventListener("keyup", handleKeyUp);
      // canvas.removeEventListener("mousemove", handleMouseMove);
      // canvas.removeEventListener("mousedown", handleMouseDown);
      // canvas.removeEventListener("mouseup", handleMouseUp);
      // canvas.removeEventListener("contextmenu", handleContextMenu);
      // canvas.removeEventListener("touchstart", handleTouchStart);
      // canvas.removeEventListener("touchmove", handleTouchMove);
      // canvas.removeEventListener("touchend", handleTouchEnd);
      console.log("Cleaning up event listeners");
      // setIsInitialized(false);
    };
  }, [initializeEngine, isInitialized, debugStore]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full touch-none"
      style={{
        imageRendering: "auto",
      }}
    />
  );
}
