"use client";

import { useCallback, useEffect, useRef } from "react";

import { SidebarInset, SidebarProvider } from "@acme/ui/sidebar";

import { GameEngine } from "../../lib/ecs/engine";
import { DebugSidebar } from "./debug-sidebar";

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
  const engineRef = useRef<GameEngine | null>(null);

  const getMetrics = useCallback(() => {
    return (
      engineRef.current?.getMetrics() ?? {
        componentCounts: {
          movement: 0,
          player: 0,
          position: 0,
        },
        entityCount: 0,
        fps: 0,
        lastFrameTime: 0,
        memoryUsage: 0,
      }
    );
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create game engine
    engineRef.current = new GameEngine(canvas);
    const engine = engineRef.current;

    // Add event listeners
    globalThis.addEventListener("keydown", engine.handleKeyDown);

    // Start game loop
    engine.start();

    // Cleanup
    return () => {
      globalThis.removeEventListener("keydown", engine.handleKeyDown);
      engine.cleanup();
      engineRef.current = null;
    };
  }, []);

  return (
    <SidebarProvider>
      <DebugSidebar getMetrics={getMetrics} />
      <SidebarInset>
        <main className="fixed inset-0 bg-zinc-800">
          <canvas ref={canvasRef} className="h-full w-full bg-white" />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
