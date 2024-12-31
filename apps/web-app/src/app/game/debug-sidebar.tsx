"use client";

import { useEffect, useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from "@acme/ui/sidebar";

import type { DebugMetrics } from "../../lib/ecs/engine";
import type { DataPoint } from "../../lib/ecs/types";
import { ECSStatus } from "./components/ecs-status";
import { ModeToggle } from "./components/mode-toggle";
import { PerformanceMetrics } from "./components/performance-metrics";

interface DebugSidebarProps {
  getMetrics: () => DebugMetrics;
}

export function DebugSidebar({ getMetrics }: DebugSidebarProps) {
  const [metrics, setMetrics] = useState<DebugMetrics>({
    componentCounts: {
      movement: 0,
      player: 0,
      position: 0,
    },
    entityCount: 0,
    fps: 0,
    lastFrameTime: 0,
    memoryUsage: 0,
  });

  const [fpsHistory, setFpsHistory] = useState<DataPoint[]>([]);
  const [frameTimeHistory, setFrameTimeHistory] = useState<DataPoint[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<DataPoint[]>([]);
  const MAX_HISTORY = 50; // Keep 50 data points for all metrics
  const UPDATE_INTERVAL = 100; // Update every 100ms

  useEffect(() => {
    let frameId: number;
    let lastUpdateTime = performance.now();

    const updateMetrics = () => {
      const currentTime = performance.now();

      // Update metrics more frequently
      if (currentTime - lastUpdateTime >= UPDATE_INTERVAL) {
        const newMetrics = getMetrics();
        setMetrics(newMetrics);

        // Update FPS history
        setFpsHistory((previous) => {
          const newPoint = {
            timestamp: currentTime,
            value: newMetrics.fps,
          };
          const newHistory = [...previous, newPoint];
          if (newHistory.length > MAX_HISTORY) {
            newHistory.shift();
          }
          return newHistory;
        });

        // Update frame time history
        setFrameTimeHistory((previous) => {
          const newPoint = {
            timestamp: currentTime,
            value: newMetrics.lastFrameTime,
          };
          const newHistory = [...previous, newPoint];
          if (newHistory.length > MAX_HISTORY) {
            newHistory.shift();
          }
          return newHistory;
        });

        // Update memory history
        setMemoryHistory((previous) => {
          const newPoint = {
            timestamp: currentTime,
            value: newMetrics.memoryUsage / 1024 / 1024, // Convert to MB
          };
          const newHistory = [...previous, newPoint];
          if (newHistory.length > MAX_HISTORY) {
            newHistory.shift();
          }
          return newHistory;
        });

        lastUpdateTime = currentTime;
      }

      frameId = requestAnimationFrame(updateMetrics);
    };

    frameId = requestAnimationFrame(updateMetrics);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [getMetrics]);

  return (
    <Sidebar collapsible="icon" className="border-l">
      <SidebarHeader className="flex-row items-center justify-between gap-2">
        <SidebarTrigger className="h-8 w-8" />
        <div className="group-data-[collapsible=icon]:hidden">
          <ModeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <PerformanceMetrics
          metrics={metrics}
          fpsHistory={fpsHistory}
          frameTimeHistory={frameTimeHistory}
          memoryHistory={memoryHistory}
        />
        <ECSStatus metrics={metrics} />
      </SidebarContent>
    </Sidebar>
  );
}
