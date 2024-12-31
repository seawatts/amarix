"use client";

import type { LucideIcon } from "lucide-react";
import { useState } from "react";

import { SidebarMenuButton, SidebarMenuItem } from "@acme/ui/sidebar";

import type { DataPoint } from "../../lib/ecs/types";
import { MetricChart } from "./metric-chart";

interface PerformanceMetricProps {
  label: string;
  value: number;
  data: DataPoint[];
  icon: LucideIcon;
  unit: string;
  minDomain?: number;
  maxDomain?: number | "auto";
  formatValue?: (value: number) => string;
}

export function PerformanceMetric({
  label,
  value,
  data,
  icon: Icon,
  unit,
  minDomain = 0,
  maxDomain = "auto",
  formatValue = (v) => v.toFixed(0),
}: PerformanceMetricProps) {
  const [showChart, setShowChart] = useState(false);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={() => setShowChart(!showChart)}>
        <Icon className="size-4" />
        <span>
          {label}: {formatValue(value)}
          {unit}
        </span>
      </SidebarMenuButton>
      {showChart && (
        <div className="px-2 py-1">
          <MetricChart
            data={data}
            label={unit}
            minDomain={minDomain}
            maxDomain={maxDomain}
          />
        </div>
      )}
    </SidebarMenuItem>
  );
}
