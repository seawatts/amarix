"use client";

import { ChevronRight, LayersIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@acme/ui/collapsible";
import { Input } from "@acme/ui/input";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@acme/ui/sidebar";

import { useGameStore } from "~/providers/game-store-provider";

interface EntityDetailsSidebarProps {
  entityId: number;
}

export function EntityDetailsSidebar({ entityId }: EntityDetailsSidebarProps) {
  const metrics = useGameStore((state) => state.metrics);
  const engine = useGameStore((state) => state.engine);
  const entity = metrics?.entities.find((entity) => entity.id === entityId);

  if (!entity || !engine) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <div className="flex items-center gap-2">
          <LayersIcon className="size-4" />
          <span>{entity.name ?? `Entity ${entity.id}`}</span>
        </div>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        {/* <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-medium">Components</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-6">
                <PlusIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.keys(engine.components)
                .filter((name) => !entity.components[name])
                .map((name) => (
                  <DropdownMenuItem
                    key={name}
                    onClick={() => {
                      engine.addComponent(entityId, name);
                    }}
                  >
                    {name}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div> */}
        <SidebarMenu>
          {Object.entries(entity.components).map(
            ([componentName, componentData]) => (
              <Collapsible key={componentName} className="group/entity-details">
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="flex items-center justify-between">
                    <span>{componentName}</span>
                    {/* <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 opacity-0 group-hover/entity-details:opacity-100"
                        onClick={(event: React.MouseEvent) => {
                          event.stopPropagation();
                          engine.removeComponent(entityId, componentName);
                        }}
                      >
                        <Trash2Icon className="size-4" />
                      </Button> */}
                    <ChevronRight className="size-4 transition-transform duration-200 group-data-[state=open]/entity-details:rotate-90" />
                    {/* </div> */}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {Object.entries(componentData.data).map(([key, value]) => (
                    <SidebarMenuItem key={`${componentName}-${key}`}>
                      <SidebarMenuButton className="data-[active=true]:bg-transparent">
                        <div className="flex w-full items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {key}:
                          </span>
                          <Input
                            type={typeof value === "number" ? "number" : "text"}
                            value={value as string | number}
                            className="h-7"
                            onChange={(event) => {
                              const component = componentData.component;
                              if (!component[key]) return;

                              const newValue =
                                event.target.type === "number"
                                  ? Number(event.target.value)
                                  : event.target.value;

                              // // Update the component's TypedArray or Array directly
                              if (ArrayBuffer.isView(component[key])) {
                                (
                                  component[key] as
                                    | Float32Array
                                    | Uint8Array
                                    | Uint32Array
                                )[entityId] = newValue;
                              } else if (Array.isArray(component[key])) {
                                component[key][entityId] = newValue;
                              }

                              // Force a game state update to refresh the UI
                            }}
                          />
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ),
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
