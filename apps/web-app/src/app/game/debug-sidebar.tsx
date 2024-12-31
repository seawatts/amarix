"use client";

import { useEffect, useState } from "react";
import { ChevronRight, File, Folder } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@acme/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@acme/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Text } from "@acme/ui/typography";

interface DebugMetrics {
  fps: number;
  entityCount: number;
  componentCounts: {
    position: number;
    movement: number;
    player: number;
  };
  memoryUsage: number;
  lastFrameTime: number;
}

interface DebugSidebarProps {
  getMetrics: () => DebugMetrics;
}

// ECS file tree structure
const ecsTree = [
  ["components", "Position.ts", "Movement.ts", "Player.ts"],
  ["systems", "movement.ts", "render.ts"],
  ["queries", "movement.ts", "render.ts"],
  "world.ts",
];

function Tree({ item }: { item: string | any[] }) {
  const [name, ...items] = Array.isArray(item) ? item : [item];

  if (items.length === 0) {
    return (
      <SidebarMenuButton>
        <File className="size-4" />
        {name}
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        defaultOpen
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRight className="size-4 transition-transform" />
            <Folder className="size-4" />
            {name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((subItem, index) => (
              <Tree key={index} item={subItem} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
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

  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const updateMetrics = () => {
      const currentTime = performance.now();
      frameCount++;

      // Update FPS every second
      if (currentTime - lastTime >= 1000) {
        const newMetrics = getMetrics();
        newMetrics.fps = frameCount;
        setMetrics(newMetrics);

        frameCount = 0;
        lastTime = currentTime;
      }

      frameId = requestAnimationFrame(updateMetrics);
    };

    frameId = requestAnimationFrame(updateMetrics);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [getMetrics]);

  return (
    <Sidebar className="border-l">
      <SidebarContent>
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="metrics" className="flex-1">
              Metrics
            </TabsTrigger>
            <TabsTrigger value="ecs" className="flex-1">
              ECS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="mt-0">
            <SidebarGroup>
              <SidebarGroupLabel>Performance</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="grid grid-cols-2 gap-2 rounded-lg border p-4">
                  <Text>FPS</Text>
                  <Text>{metrics.fps}</Text>
                  <Text>Frame Time</Text>
                  <Text>{metrics.lastFrameTime.toFixed(2)}ms</Text>
                  <Text>Memory Usage</Text>
                  <Text>
                    {(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB
                  </Text>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>ECS Status</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="grid grid-cols-2 gap-2 rounded-lg border p-4">
                  <Text>Total Entities</Text>
                  <Text>{metrics.entityCount}</Text>
                  <Text>Position Components</Text>
                  <Text>{metrics.componentCounts.position}</Text>
                  <Text>Movement Components</Text>
                  <Text>{metrics.componentCounts.movement}</Text>
                  <Text>Player Components</Text>
                  <Text>{metrics.componentCounts.player}</Text>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </TabsContent>

          <TabsContent value="ecs" className="mt-0">
            <SidebarGroup>
              <SidebarGroupLabel>Files</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {ecsTree.map((item, index) => (
                    <Tree key={index} item={item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </TabsContent>
        </Tabs>
      </SidebarContent>
    </Sidebar>
  );
}
