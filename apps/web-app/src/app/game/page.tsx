"use client";

import { useEffect, useRef } from "react";

import { SidebarInset, SidebarProvider } from "@acme/ui/sidebar";

import { useGameStore } from "~/providers/game-store-provider";
import { DebugSidebar } from "../../components/debug-sidebar/sidebar";
import { NPCInteractionManager } from "../../components/npc-interaction-manager";
import { GameEngine } from "../../lib/ecs/engine";

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set initial canvas size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Create game engine
    const newEngine = new GameEngine(canvas, store);
    store.setEngine(newEngine);
    store.setWorld(newEngine.world);

    // Define handlers inside effect
    const handleKeyDown = (event: KeyboardEvent) => {
      newEngine.handleKeyDown(event);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      newEngine.handleKeyUp(event);
    };

    // Add event listeners
    globalThis.addEventListener("keydown", handleKeyDown);
    globalThis.addEventListener("keyup", handleKeyUp);

    // Start game loop
    newEngine.start();

    // Cleanup
    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
      globalThis.removeEventListener("keyup", handleKeyUp);
      newEngine.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SidebarProvider>
      <DebugSidebar />
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
    </SidebarProvider>
  );
}
