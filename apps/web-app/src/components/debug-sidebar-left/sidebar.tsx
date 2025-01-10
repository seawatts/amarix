"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@acme/ui/sidebar";

import { DebugToggles } from "./debug-toggles";
import { ECSStatus } from "./ecs-status";
import { ModeToggle } from "./mode-toggle";
import { PerformanceMetrics } from "./performance-metrics";

export function DebugSidebarLeft() {
  return (
    <Sidebar collapsible="offcanvas" className="border-r-0">
      <SidebarHeader className="flex-row items-center justify-between gap-2">
        <SidebarTrigger className="h-8 w-8" />
        <div className="group-data-[collapsible=icon]:hidden">
          <ModeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <PerformanceMetrics />
        <DebugToggles />
        <ECSStatus />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
