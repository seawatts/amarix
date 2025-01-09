"use client";

import { useEffect, useRef } from "react";

import {
  FloatingToolbar,
  FloatingToolbarButton,
  FloatingToolbarSeparator,
} from "@acme/ui/floating-toolbar";
import { Icons } from "@acme/ui/icons";
import { SidebarInset, SidebarProvider } from "@acme/ui/sidebar";

import { DebugSidebarLeft } from "~/components/debug-sidebar/sidebar-left";
import { DebugSidebarRight } from "~/components/debug-sidebar/sidebar-right";
import { NPCInteractionManager } from "~/components/npc-interaction-manager";
import { GameEngine } from "~/lib/ecs/engine";
import { clearKeyDown, setKeyDown } from "~/lib/ecs/utils/keyboard";
import {
  clearMouseButtonDown,
  getCanvasCoordinates,
  setMouseButtonDown,
  updateMousePosition,
} from "~/lib/ecs/utils/mouse";
import { useDebugStore } from "~/providers/debug-provider";
import { useGameStore } from "~/providers/game-store-provider";

declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
    };
  }
}

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const store = useGameStore((state) => state);
  const debugStore = useDebugStore((state) => state);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get the viewport size and set up canvas
    const rect = canvas.getBoundingClientRect();
    const viewportWidth = rect.width;
    const viewportHeight = rect.height;

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

    // Create game engine after canvas is properly sized
    const newEngine = new GameEngine(canvas, store, debugStore);
    store.setEngine(newEngine);
    store.setWorld(newEngine.world);

    // Define keyboard handlers
    const handleKeyDown = (event: KeyboardEvent) => {
      const playerEid = newEngine.getPlayerEid();
      const cameraEid = newEngine.getCameraEid();
      setKeyDown(playerEid, event.code);
      setKeyDown(cameraEid, event.code);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const playerEid = newEngine.getPlayerEid();
      const cameraEid = newEngine.getCameraEid();
      clearKeyDown(playerEid, event.code);
      clearKeyDown(cameraEid, event.code);
    };

    // Define mouse handlers
    const handleMouseMove = (event: MouseEvent) => {
      const playerEid = newEngine.getPlayerEid();
      const { x, y } = getCanvasCoordinates(event, canvas);
      updateMousePosition(playerEid, x, y, x, y);
    };

    const handleMouseDown = (event: MouseEvent) => {
      const playerEid = newEngine.getPlayerEid();
      setMouseButtonDown(playerEid, event.button);
    };

    const handleMouseUp = (event: MouseEvent) => {
      const playerEid = newEngine.getPlayerEid();
      clearMouseButtonDown(playerEid, event.button);
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    // Add event listeners
    globalThis.addEventListener("keydown", handleKeyDown);
    globalThis.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("contextmenu", handleContextMenu);

    // Start game loop
    newEngine.start();

    // Cleanup
    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
      globalThis.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("contextmenu", handleContextMenu);
      newEngine.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SidebarProvider>
      <DebugSidebarLeft />
      <SidebarInset>
        <main className="fixed inset-0 bg-zinc-800">
          <canvas
            ref={canvasRef}
            className="h-full w-full bg-white"
            style={{
              imageRendering: "auto",
            }}
          />
          <NPCInteractionManager />
          <FloatingToolbar>
            <FloatingToolbarButton icon={<Icons.ArrowRight size="sm" />} />
            <FloatingToolbarSeparator />
            <FloatingToolbarButton icon={<Icons.Flame size="sm" />} />
            <FloatingToolbarButton icon={<Icons.Text size="sm" />} />
            <FloatingToolbarButton icon={<Icons.Circle size="sm" />} />
            <FloatingToolbarButton icon={<Icons.UsersRound size="sm" />} />
            <FloatingToolbarSeparator />
            <FloatingToolbarButton
              icon={<Icons.Command size="sm" />}
              variant={
                debugStore.selectedEntityId === null ? undefined : "secondary"
              }
            />
          </FloatingToolbar>
        </main>
      </SidebarInset>
      <DebugSidebarRight />
    </SidebarProvider>
  );
}
