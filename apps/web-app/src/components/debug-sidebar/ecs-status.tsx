"use client";

import {
  ChevronRight,
  Component,
  Keyboard,
  LayersIcon,
  MapPin,
  Mouse,
  Puzzle,
  Settings,
  Swords,
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
      <Collapsible className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRight className="transition-transform" />
            <Component className="size-4" />
            {item.name}
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

function transformComponentToTree(
  name: string,
  value: unknown,
): ComponentTreeItem {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      children: Object.entries(value).map(([key, value_]) =>
        transformComponentToTree(key, value_),
      ),
      name,
      value,
    };
  }

  return {
    name,
    value,
  };
}

export function ECSStatus() {
  const metrics = useGameStore((state) => state.metrics);

  if (!metrics) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>ECS Status</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <MapPin className="size-4" />
              <span>
                Player Position [{metrics.playerPosition.gridX},{" "}
                {metrics.playerPosition.gridY}]
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Keyboard className="size-4" />
              <span>Input</span>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  Keys:{" "}
                  {metrics.input.pressedKeys.length > 0
                    ? metrics.input.pressedKeys.join(" + ")
                    : "None"}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Mouse className="size-4" />
                  <span>Mouse</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      Position: [{metrics.input.mouse.position.x},{" "}
                      {metrics.input.mouse.position.y}]
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      Buttons:{" "}
                      {[
                        metrics.input.mouse.buttons.left && "Left",
                        metrics.input.mouse.buttons.middle && "Middle",
                        metrics.input.mouse.buttons.right && "Right",
                      ]
                        .filter(Boolean)
                        .join(" + ") || "None"}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      Hovered: {metrics.input.mouse.hoveredEntity || "None"}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      Clicked: {metrics.input.mouse.clickedEntity || "None"}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Swords className="size-4" />
              <span>Battle</span>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  Active: {metrics.battle.isActive ? "Yes" : "No"}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  Turn: {metrics.battle.currentTurn ?? "N/A"}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Puzzle className="size-4" />
              <span>Entities: {metrics.componentCounts.position}</span>
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
              <SidebarMenuItem>
                <SidebarMenuButton>
                  NPCs: {metrics.componentCounts.npc}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  Hostile NPCs: {metrics.componentCounts.hostileNpc}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  NPC Interactions: {metrics.componentCounts.npcInteraction}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  In Battle: {metrics.componentCounts.inBattle}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  Bounding Boxes: {metrics.componentCounts.boundingBox}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  Physics: {metrics.componentCounts.physics}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  Collidable: {metrics.componentCounts.collidable}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <LayersIcon className="size-4" />
              <span>Entity Tree</span>
            </SidebarMenuButton>
            <SidebarMenuSub>
              {metrics.entities.map((entity) => (
                <SidebarMenuItem key={entity.id}>
                  <Collapsible className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90">
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <ChevronRight className="transition-transform" />
                        <LayersIcon className="size-4" />
                        Entity {entity.id}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {Object.entries(entity.components).map(
                          ([name, value]) => (
                            <ComponentTree
                              key={name}
                              item={transformComponentToTree(name, value)}
                            />
                          ),
                        )}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              ))}
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
