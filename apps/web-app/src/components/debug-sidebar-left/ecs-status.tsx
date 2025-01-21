"use client";

import {
  ChevronRight,
  KeyboardIcon,
  LayersIcon,
  MousePointerIcon,
  Settings,
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
  SidebarMenuSub,
} from "@acme/ui/sidebar";

import { getPressedKeys } from "~/lib/ecs/utils/keyboard";
import { getMouseState } from "~/lib/ecs/utils/mouse";
import { useDebugStore } from "~/providers/debug-provider";

export function ECSStatus() {
  const entities = useDebugStore((state) => state.metrics?.entities);
  const setSelectedEntityId = useDebugStore(
    (state) => state.setSelectedEntityId,
  );
  const isECSOpen = useDebugStore((state) => state.sidebarSections.ecs);
  const toggleSidebarSection = useDebugStore(
    (state) => state.toggleSidebarSection,
  );

  if (!entities) return null;

  // Count total entities
  const totalEntities = entities.length;

  // Count component types
  const componentCounts = new Map<string, number>();
  for (const entity of entities) {
    for (const componentName of Object.keys(entity.components)) {
      componentCounts.set(
        componentName,
        (componentCounts.get(componentName) ?? 0) + 1,
      );
    }
  }

  // Get current mouse state
  const mouseState = getMouseState();

  // Get current keyboard state
  const pressedKeys = getPressedKeys();

  return (
    <SidebarGroup>
      <Collapsible
        className="group/collapsible"
        open={isECSOpen}
        onOpenChange={() => toggleSidebarSection("ecs")}
      >
        <CollapsibleTrigger className="w-full">
          <SidebarGroupLabel>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <LayersIcon className="size-4" />
                <span>ECS</span>
              </div>
              <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </div>
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <LayersIcon className="size-4" />
                  <span>Total Entities: {totalEntities}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Mouse State Section */}
              <SidebarMenuItem>
                <Collapsible className="group/mouse">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <MousePointerIcon className="size-4" />
                      <span>Mouse State</span>
                      <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/mouse:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <span className="text-muted-foreground">
                            Buttons:
                          </span>
                          <span className="ml-2">
                            {Object.entries(mouseState.buttons)
                              .filter(([, pressed]) => pressed)
                              .map(([button]) => button)
                              .join(", ") || "None"}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <span className="text-muted-foreground">Screen:</span>
                          <span className="ml-2">
                            ({mouseState.position.screen.x},{" "}
                            {mouseState.position.screen.y})
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <span className="text-muted-foreground">World:</span>
                          <span className="ml-2">
                            ({mouseState.position.world.x},{" "}
                            {mouseState.position.world.y})
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <span className="text-muted-foreground">
                            Hovered:
                          </span>
                          <span className="ml-2">
                            {mouseState.hoveredEntity > 0
                              ? mouseState.hoveredEntity
                              : "None"}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <span className="text-muted-foreground">
                            Clicked:
                          </span>
                          <span className="ml-2">
                            {mouseState.clickedEntity > 0
                              ? mouseState.clickedEntity
                              : "None"}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              {/* Keyboard State Section */}
              <SidebarMenuItem>
                <Collapsible className="group/keyboard">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <KeyboardIcon className="size-4" />
                      <span>Keyboard State</span>
                      <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/keyboard:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <span className="text-muted-foreground">
                            Pressed:
                          </span>
                          <span className="ml-2">
                            {pressedKeys.length > 0
                              ? pressedKeys.join(", ")
                              : "None"}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              {/* Components Section */}
              <SidebarMenuItem>
                <Collapsible className="group/components">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <Settings className="size-4" />
                      <span>Components</span>
                      <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/components:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {[...componentCounts.entries()]
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([name, count]) => (
                          <SidebarMenuItem key={name}>
                            <SidebarMenuButton>
                              {name}: {count}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              {/* Entity Tree Section */}
              <SidebarMenuItem>
                <Collapsible className="group/entities">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <LayersIcon className="size-4" />
                      <span>Entity Tree</span>
                      <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/entities:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {entities.map((entity) => (
                        <SidebarMenuItem key={entity.id}>
                          <SidebarMenuButton
                            onClick={() => setSelectedEntityId(entity.id)}
                          >
                            <LayersIcon className="size-4" />
                            {entity.name ?? `Entity ${entity.id}`}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}
