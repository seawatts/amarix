"use client";

import { ChevronRight, Component, LayersIcon, Settings } from "lucide-react";

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

import { useDebugStore } from "~/providers/debug-provider";
import { useGameStore } from "~/providers/game-store-provider";

function formatValue(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "number") {
    return value.toString();
  }
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${formatValue(v)}`)
      .join(", ");
  }
  return String(value);
}

interface ComponentTreeItem {
  name: string;
  value: unknown;
  children?: ComponentTreeItem[];
}

function ComponentTree({ item }: { item: ComponentTreeItem }) {
  if (!item.children) {
    return (
      <SidebarMenuButton className="data-[active=true]:bg-transparent">
        <span className="text-muted-foreground">{item.name}:</span>
        <span className="ml-2">{formatValue(item.value)}</span>
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible className="group/collapsible">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <Component className="size-4" />
            {item.name}
            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />{" "}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((child) => (
              <ComponentTree key={`${item.name}-${child.name}`} item={child} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

export function ECSStatus() {
  const metrics = useGameStore((state) => state.metrics);
  const setSelectedEntityId = useDebugStore(
    (state) => state.setSelectedEntityId,
  );

  if (!metrics) return null;

  // Count total entities
  const totalEntities = metrics.entities.length;

  // Count component types
  const componentCounts = new Map<string, number>();
  for (const entity of metrics.entities) {
    for (const componentName of Object.keys(entity.components)) {
      componentCounts.set(
        componentName,
        (componentCounts.get(componentName) ?? 0) + 1,
      );
    }
  }

  return (
    <SidebarGroup>
      <Collapsible className="group/collapsible">
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

              <SidebarMenuItem>
                <Collapsible className="group/components [&[data-state=open]>button>svg:first-child]:rotate-90">
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
                      {metrics.entities.map((entity) => (
                        <SidebarMenuItem key={entity.id}>
                          <SidebarMenuButton
                            onClick={() => setSelectedEntityId(entity.id)}
                          >
                            <LayersIcon className="size-4" />
                            {entity.name ?? `Entity ${entity.id}`}
                            {/* <ChevronRight */}
                            {/* className={`ml-auto size-4 transition-transform duration-200 group-data-[state=open]/entity-${entity.id}:rotate-90`} */}
                            {/* /> */}
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
