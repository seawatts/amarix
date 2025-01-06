"use client";

import { useEffect, useRef } from "react";

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

    // Set initial canvas size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Create game engine
    const newEngine = new GameEngine(canvas, store, debugStore);
    store.setEngine(newEngine);
    store.setWorld(newEngine.world);

    // Define keyboard handlers
    const handleKeyDown = (event: KeyboardEvent) => {
      const playerEid = newEngine.getPlayerEid();
      setKeyDown(playerEid, event.code);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const playerEid = newEngine.getPlayerEid();
      clearKeyDown(playerEid, event.code);
    };

    // Define mouse handlers
    const handleMouseMove = (event: MouseEvent) => {
      const playerEid = newEngine.getPlayerEid();
      const { x, y } = getCanvasCoordinates(event, canvas);
      updateMousePosition(playerEid, x, y);
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
              imageRendering: "pixelated",
            }}
          />
          <NPCInteractionManager />
        </main>
      </SidebarInset>
      <DebugSidebarRight />
    </SidebarProvider>
  );
}
