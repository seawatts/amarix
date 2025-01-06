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
  const metrics = useGameStore((state) => state.metrics);
  const [fpsHistory, setFpsHistory] = useState<DataPoint[]>([]);
  const [frameTimeHistory, setFrameTimeHistory] = useState<DataPoint[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<DataPoint[]>([]);
  const [systemHistory, setSystemHistory] = useState<SystemHistory>({});
  const MAX_HISTORY = 50; // Keep 50 data points for all metrics

  useEffect(() => {
    if (!engine || !metrics) return;

    const interval = setInterval(() => {
      const timestamp = Date.now();

      // Update FPS history
      setFpsHistory((previous) => {
        const newHistory = [
          ...previous,
          {
            timestamp,
            value: metrics.performance.fps,
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
            value: metrics.performance.frameTime,
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
            value: metrics.performance.memoryUsage,
          },
        ].slice(-MAX_HISTORY);
        return newHistory;
      });

      // Update system performance history
      setSystemHistory((previous) => {
        const newHistory = { ...previous };
        for (const [name, time] of Object.entries(
          metrics.performance.systems,
        )) {
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
    }, 100);

    return () => clearInterval(interval);
  }, [engine, metrics]);

  if (!engine || !metrics) return null;

  const fps = metrics.performance.fps;
  const frameTime = metrics.performance.frameTime;
  const memoryUsage = metrics.performance.memoryUsage;
  const memoryMB = memoryUsage / 1024 / 1024;

  return (
    <SidebarGroup>
      <Collapsible className="group/performance">
        <CollapsibleTrigger className="w-full">
          <SidebarGroupLabel>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="size-4" />
                <span>Performance</span>
              </div>
              <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/performance:rotate-90" />
            </div>
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
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
              <Collapsible className="group/collapsible">
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip="Systems">
                    <Timer className="size-4" />
                    <span>Systems</span>
                    <span>
                      {Object.values(metrics.performance.systems)
                        .reduce((sum, time) => sum + time, 0)
                        .toFixed(2)}{" "}
                      ms
                    </span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <SidebarMenuSub>
                  <CollapsibleContent>
                    {Object.entries(metrics.performance.systems).map(
                      ([name, time]) => (
                        <PerformanceMetric
                          key={name}
                          label={startCase(name.replaceAll("System", ""))}
                          value={time}
                          data={systemHistory[name] ?? []}
                          unit="ms"
                          minDomain={0}
                          maxDomain="auto"
                          formatValue={(v) => v.toFixed(2)}
                        />
                      ),
                    )}
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
