"use client";

import { Activity, Gauge, LayoutDashboard } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@acme/ui/sidebar";

import type { DebugMetrics } from "../../lib/ecs/engine";
import type { DataPoint } from "../../lib/ecs/types";
import { PerformanceMetric } from "./performance-metric";

interface PerformanceMetricsProps {
  metrics: DebugMetrics;
  fpsHistory: DataPoint[];
  frameTimeHistory: DataPoint[];
  memoryHistory: DataPoint[];
}

export function PerformanceMetrics({
  metrics,
  fpsHistory,
  frameTimeHistory,
  memoryHistory,
}: PerformanceMetricsProps) {
  const memoryMB = metrics.memoryUsage / 1024 / 1024;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Performance</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <PerformanceMetric
            label="FPS"
            value={metrics.fps}
            data={fpsHistory}
            icon={Gauge}
            unit=""
            minDomain={0}
            maxDomain={100}
            formatValue={(v) => Math.round(v).toString()}
          />
          <PerformanceMetric
            label="Frame Time"
            value={metrics.lastFrameTime}
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
