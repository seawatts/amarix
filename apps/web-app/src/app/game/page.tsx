"use client";

import { useCallback, useEffect, useRef } from "react";
import { pipe } from "bitecs";

import { SidebarInset, SidebarProvider } from "@acme/ui/sidebar";

import { Movement, Player, Position } from "../../lib/ecs/components";
import { createMovementSystem } from "../../lib/ecs/systems/movement";
import { createRenderSystem } from "../../lib/ecs/systems/render";
import { createGameWorld, createPlayer } from "../../lib/ecs/world";
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
  const worldRef = useRef(createGameWorld());
  const playerRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(performance.now());

  const getMetrics = useCallback(() => {
    const currentTime = performance.now();
    const frameTime = currentTime - lastFrameTimeRef.current;
    lastFrameTimeRef.current = currentTime;

    // Count active entities by looking at Position components
    const entityCount = Position.x.filter(Boolean).length;

    return {
      componentCounts: {
        movement: Movement.dx.filter(Boolean).length,
        player: Object.keys(Player).length,
        position: Position.x.filter(Boolean).length,
      },
      entityCount,
      fps: 0, // This will be calculated in the DebugDialog
      lastFrameTime: frameTime,
      memoryUsage: performance.memory?.usedJSHeapSize ?? 0,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Set canvas dimensions to match window size
    const updateCanvasSize = () => {
      canvas.width = globalThis.innerWidth;
      canvas.height = globalThis.innerHeight;
    };
    updateCanvasSize();
    globalThis.addEventListener("resize", updateCanvasSize);

    // Create player if it doesn't exist
    if (playerRef.current === null) {
      playerRef.current = createPlayer(worldRef.current);
    }

    // Create pipeline
    const pipeline = pipe(
      createMovementSystem(canvas),
      createRenderSystem(canvas, context),
    );

    // Handle keyboard input
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!playerRef.current) return;

      const eid = playerRef.current;
      switch (event.key) {
        case "ArrowUp": {
          Movement.dy[eid] = -1;
          break;
        }
        case "ArrowDown": {
          Movement.dy[eid] = 1;
          break;
        }
        case "ArrowLeft": {
          Movement.dx[eid] = -1;
          break;
        }
        case "ArrowRight": {
          Movement.dx[eid] = 1;
          break;
        }
      }
    };

    // Set up game loop
    let animationFrameId: number;
    const gameLoop = () => {
      pipeline(worldRef.current);
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // Start game loop
    gameLoop();

    // Add event listeners
    globalThis.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      globalThis.removeEventListener("keydown", handleKeyDown);
      globalThis.removeEventListener("resize", updateCanvasSize);
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
