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
  SidebarMenuItem,
} from "@acme/ui/sidebar";
import { Switch } from "@acme/ui/switch";

import { useDebugStore } from "~/providers/debug-provider";

const systemIcons = {
  animation: Play,
  battle: Swords,
  camera: Eye,
  collision: Box,
  debug: Cog,
  keyboard: Keyboard,
  mouse: MousePointer,
  movement: Move,
  npcInteraction: Users,
  particle: PartyPopper,
  physics: ArrowRight,
  render: Layers,
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
  const toggleSystemPause = useDebugStore((state) => state.toggleSystemPause);
  const visualizations = useDebugStore((state) => state.visualizations);
  const toggleVisualization = useDebugStore(
    (state) => state.toggleVisualization,
  );

  const isSystemsOpen = useDebugStore((state) => state.sidebarSections.systems);
  const isVisualizationsOpen = useDebugStore(
    (state) => state.sidebarSections.visualizations,
  );
  const toggleSidebarSection = useDebugStore(
    (state) => state.toggleSidebarSection,
  );

  return (
    <>
      <Collapsible
        className="group/collapsible"
        open={isSystemsOpen}
        onOpenChange={() => toggleSidebarSection("systems")}
      >
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
                {Object.entries(systems).map(([name, state]) => {
                  const Icon =
                    systemIcons[name.toLowerCase() as keyof typeof systemIcons];
                  return (
                    <SidebarMenuItem
                      key={name}
                      className="flex-col items-start gap-2"
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="size-4" />
                          <span className="capitalize">{name}</span>
                        </div>
                        <Switch
                          checked={state.isEnabled}
                          onCheckedChange={() => toggleSystem(name)}
                        />
                      </div>
                      {state.isEnabled && (
                        <div className="flex w-full items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Paused
                          </span>
                          <Switch
                            checked={state.isPaused}
                            onCheckedChange={() => toggleSystemPause(name)}
                          />
                        </div>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      <Collapsible
        className="group/collapsible"
        open={isVisualizationsOpen}
        onOpenChange={() => toggleSidebarSection("visualizations")}
      >
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
                {Object.entries(visualizations).map(([name, isEnabled]) => {
                  const Icon =
                    visualizationIcons[name as keyof typeof visualizationIcons];
                  return (
                    <SidebarMenuItem key={name}>
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="size-4" />
                          <span className="capitalize">
                            {name.replaceAll(/([A-Z])/g, " $1").trim()}
                          </span>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => toggleVisualization(name)}
                        />
                      </div>
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
