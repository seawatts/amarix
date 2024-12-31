"use client";

import { Puzzle, Settings } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@acme/ui/sidebar";

import type { DebugMetrics } from "../../../lib/ecs/engine";

interface ECSStatusProps {
  metrics: DebugMetrics;
}

export function ECSStatus({ metrics }: ECSStatusProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>ECS Status</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Puzzle className="size-4" />
              <span>Entities: {metrics.entityCount}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings className="size-4" />
              <span>Components</span>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  Position: {metrics.componentCounts.position}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  Movement: {metrics.componentCounts.movement}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  Player: {metrics.componentCounts.player}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
