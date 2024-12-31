"use client";

import { useEffect, useState } from "react";
import { query } from "bitecs";
import { Activity, Gauge, LayoutDashboard } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@acme/ui/sidebar";

import type { DataPoint } from "~/lib/ecs/types";
import { DebugMetrics } from "~/lib/ecs/components";
import { useGameEngine } from "~/lib/store/game-engine";
import { PerformanceMetric } from "./performance-metric";

export function PerformanceMetrics() {
  const engine = useGameEngine((state) => state.engine);
  const [fpsHistory, setFpsHistory] = useState<DataPoint[]>([]);
  const [frameTimeHistory, setFrameTimeHistory] = useState<DataPoint[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<DataPoint[]>([]);
  const MAX_HISTORY = 50; // Keep 50 data points for all metrics

  useEffect(() => {
    if (!engine) return;

    const interval = setInterval(() => {
      const [metricsEntity] = query(engine.world, [DebugMetrics]);
      if (!metricsEntity) return;

      const timestamp = Date.now();

      // Update FPS history
      setFpsHistory((previous) => {
        const newHistory = [
          ...previous,
          {
            timestamp,
            value: DebugMetrics.fps[metricsEntity] ?? 0,
          },
        ].slice(-MAX_HISTORY);
        return newHistory;
      });

      // Update frame time history
      setFrameTimeHistory((previous) => {
        const newHistory = [
          ...previous,
          {
            timestamp,
            value: DebugMetrics.frameTime[metricsEntity] ?? 0,
          },
        ].slice(-MAX_HISTORY);
        return newHistory;
      });

      // Update memory history
      setMemoryHistory((previous) => {
        const newHistory = [
          ...previous,
          {
            timestamp,
            value: DebugMetrics.memoryUsage[metricsEntity] ?? 0,
          },
        ].slice(-MAX_HISTORY);
        return newHistory;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [engine]);

  if (!engine) return null;

  // Get metrics entity
  const [metricsEntity] = query(engine.world, [DebugMetrics]);
  if (!metricsEntity) return null;

  // Get metrics values
  const fps = DebugMetrics.fps[metricsEntity] ?? 0;
  const frameTime = DebugMetrics.frameTime[metricsEntity] ?? 0;
  const memoryUsage = DebugMetrics.memoryUsage[metricsEntity] ?? 0;
  const memoryMB = memoryUsage / 1024 / 1024;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Performance</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <PerformanceMetric
            label="FPS"
            value={fps}
            data={fpsHistory}
            icon={Gauge}
            unit=""
            minDomain={0}
            maxDomain={100}
            formatValue={(v) => Math.round(v).toString()}
          />
          <PerformanceMetric
            label="Frame Time"
            value={frameTime}
            data={frameTimeHistory}
            icon={Activity}
            unit="ms"
            minDomain={0}
            maxDomain={100}
          />
          <PerformanceMetric
            label="Memory"
            value={memoryMB}
            data={memoryHistory}
            icon={LayoutDashboard}
            unit="MB"
            minDomain={0}
            maxDomain="auto"
          />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
