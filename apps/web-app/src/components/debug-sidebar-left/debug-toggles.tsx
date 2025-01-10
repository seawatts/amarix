"use client";

import {
  Activity,
  ArrowRight,
  Box,
  Boxes,
  ChevronRight,
  Cog,
  Crosshair,
  Eye,
  Gamepad2,
  Keyboard,
  Layers,
  MousePointer,
  Move,
  PartyPopper,
  Play,
  Radio,
  Swords,
  Users,
  Volume2,
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
  SidebarMenuItem,
} from "@acme/ui/sidebar";
import { Switch } from "@acme/ui/switch";

import { useDebugStore } from "~/providers/debug-provider";

const systemIcons = {
  animation: Play,
  battle: Swords,
  collision: Box,
  keyboard: Keyboard,
  mouse: MousePointer,
  movement: Move,
  npcInteraction: Users,
  particle: PartyPopper,
  physics: ArrowRight,
  scene: Layers,
  script: Cog,
  sound: Volume2,
  sprite: Gamepad2,
  trigger: Radio,
} as const;

const visualizationIcons = {
  showBoundingBoxes: Boxes,
  showCollisionPoints: Crosshair,
  showForceVectors: ArrowRight,
  showParticleEmitters: PartyPopper,
  showPolygons: Box,
  showTriggerZones: Radio,
  showVelocityVectors: Activity,
} as const;

export function DebugToggles() {
  const systems = useDebugStore((state) => state.systems);
  const toggleSystem = useDebugStore((state) => state.toggleSystem);
  const visualizations = useDebugStore((state) => state.visualizations);
  const toggleVisualization = useDebugStore(
    (state) => state.toggleVisualization,
  );

  return (
    <>
      <Collapsible className="group/collapsible">
        <SidebarGroup>
          <CollapsibleTrigger className="w-full">
            <SidebarGroupLabel>
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cog className="size-4" />
                  <span>Systems</span>
                </div>
                <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </div>
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {(Object.keys(systems) as (keyof typeof systems)[]).map(
                  (system) => {
                    const Icon = systemIcons[system];
                    return (
                      <SidebarMenuItem key={system}>
                        <SidebarMenuButton
                          onClick={() => toggleSystem(system)}
                          className="justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="size-4" />
                            <span className="capitalize">
                              {system.replaceAll(/([A-Z])/g, " $1").trim()}
                            </span>
                          </div>
                          <Switch checked={systems[system]} />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  },
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      <Collapsible className="group/collapsible">
        <SidebarGroup>
          <CollapsibleTrigger className="w-full">
            <SidebarGroupLabel>
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="size-4" />
                  <span>Visualizations</span>
                </div>
                <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </div>
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {(
                  Object.keys(visualizations) as (keyof typeof visualizations)[]
                ).map((viz) => {
                  const Icon = visualizationIcons[viz];
                  return (
                    <SidebarMenuItem key={viz}>
                      <SidebarMenuButton
                        onClick={() => toggleVisualization(viz)}
                        className="justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="size-4" />
                          <span className="capitalize">
                            {viz
                              .replaceAll(/([A-Z])/g, " $1")
                              .trim()
                              .slice(4)}
                          </span>
                        </div>
                        <Switch checked={visualizations[viz]} />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    </>
  );
}
