"use client";

import {
  Keyboard,
  MapPin,
  Mouse,
  Puzzle,
  Settings,
  Swords,
} from "lucide-react";

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
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
