"use client";

import { useEffect, useState } from "react";
import { startCase } from "lodash-es";
import {
  Activity,
  ChevronRight,
  Gauge,
  LayoutDashboard,
  Timer,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@acme/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuSub,
} from "@acme/ui/sidebar";

import type { DataPoint } from "~/lib/ecs/types";
import { useGameStore } from "~/providers/game-store-provider";
import { PerformanceMetric } from "./performance-metric";

type SystemHistory = Record<string, DataPoint[]>;

export function PerformanceMetrics() {
  const engine = useGameStore((state) => state.engine);
  const fps = useGameStore((state) => state.metrics?.performance.fps);
  const frameTime = useGameStore(
    (state) => state.metrics?.performance.frameTime,
  );
  const memoryUsage = useGameStore(
    (state) => state.metrics?.performance.memoryUsage,
  );
  const systems = useGameStore((state) => state.metrics?.performance.systems);
  const [fpsHistory, setFpsHistory] = useState<DataPoint[]>([]);
  const [frameTimeHistory, setFrameTimeHistory] = useState<DataPoint[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<DataPoint[]>([]);
  const [systemHistory, setSystemHistory] = useState<SystemHistory>({});
  const MAX_HISTORY = 1000; // Keep 50 data points for all metrics

  useEffect(() => {
    const timestamp = Date.now();

    // Update FPS history
    setFpsHistory((previous) => {
      const newHistory = [
        ...previous,
        {
          timestamp,
          value: fps ?? 0,
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
          value: frameTime ?? 0,
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
          value: memoryUsage ?? 0,
        },
      ].slice(-MAX_HISTORY);
      return newHistory;
    });

    // Update system performance history
    setSystemHistory((previous) => {
      const newHistory = { ...previous };
      for (const [name, time] of Object.entries(systems ?? {})) {
        newHistory[name] = [
          ...(previous[name] ?? []),
          {
            timestamp,
            value: time,
          },
        ].slice(-MAX_HISTORY);
      }
      return newHistory;
    });
  }, [fps, frameTime, memoryUsage, systems]);

  if (!engine) return null;

  const memoryMB = memoryUsage ? memoryUsage / 1024 / 1024 : 0;

  return (
    <SidebarGroup>
      <Collapsible
        className="group/performance"
        data-testid="performance-metrics"
      >
        <CollapsibleTrigger
          className="w-full"
          data-testid="performance-metrics-trigger"
        >
          <SidebarGroupLabel>
            <div
              className="flex w-full items-center justify-between"
              data-testid="performance-metrics-header"
            >
              <div
                className="flex items-center gap-2"
                data-testid="performance-metrics-title"
              >
                <Gauge className="size-4" />
                <span>Performance</span>
              </div>
              <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/performance:rotate-90" />
            </div>
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu data-testid="performance-metrics-menu">
              <PerformanceMetric
                label="FPS"
                value={fps ?? 0}
                data={fpsHistory}
                icon={Gauge}
                unit=""
                minDomain={0}
                maxDomain={100}
                formatValue={(v) => Math.round(v).toString()}
                data-testid="performance-metrics-fps"
              />
              <PerformanceMetric
                label="Frame Time"
                value={frameTime ?? 0}
                data={frameTimeHistory}
                icon={Activity}
                unit="ms"
                minDomain={0}
                maxDomain={100}
                data-testid="performance-metrics-frame-time"
              />
              <PerformanceMetric
                label="Memory"
                value={memoryMB}
                data={memoryHistory}
                icon={LayoutDashboard}
                unit="MB"
                minDomain={0}
                maxDomain="auto"
                data-testid="performance-metrics-memory"
              />
              <Collapsible
                className="group/collapsible"
                data-testid="performance-metrics-systems"
              >
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip="Systems"
                    data-testid="performance-metrics-systems-button"
                  >
                    <Timer className="size-4" />
                    <span data-testid="performance-metrics-systems-label">
                      Systems
                    </span>
                    <span data-testid="performance-metrics-systems-total">
                      {Object.values(systems ?? {})
                        .reduce((sum, time) => sum + time, 0)
                        .toFixed(2)}{" "}
                      ms
                    </span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <SidebarMenuSub>
                  <CollapsibleContent data-testid="performance-metrics-systems-content">
                    {Object.entries(systems ?? {}).map(([name, time]) => (
                      <PerformanceMetric
                        key={name}
                        label={startCase(name.replaceAll("System", ""))}
                        value={time}
                        data={systemHistory[name] ?? []}
                        unit="ms"
                        minDomain={0}
                        maxDomain="auto"
                        formatValue={(v) => v.toFixed(2)}
                        data-testid={`performance-metrics-system-${name}`}
                      />
                    ))}
                  </CollapsibleContent>
                </SidebarMenuSub>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}
