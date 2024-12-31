"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from "@acme/ui/sidebar";

import { ECSStatus } from "./ecs-status";
import { ModeToggle } from "./mode-toggle";
import { PerformanceMetrics } from "./performance-metrics";

export function DebugSidebar() {
  return (
    <Sidebar collapsible="offcanvas" className="border-l">
      <SidebarHeader className="flex-row items-center justify-between gap-2">
        <SidebarTrigger className="h-8 w-8" />
        <div className="group-data-[collapsible=icon]:hidden">
          <ModeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col gap-4">
          <PerformanceMetrics />
          <ECSStatus />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
