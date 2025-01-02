"use client";

import { Keyboard, MapPin, Puzzle, Settings, Swords } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@acme/ui/sidebar";

import { InputState } from "~/lib/ecs/input";
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
                  {InputState.pressedKeys.size > 0
                    ? [...InputState.pressedKeys]
                        .map((key) => {
                          switch (key) {
                            case " ": {
                              return "Space";
                            }
                            case "ArrowUp": {
                              return "↑";
                            }
                            case "ArrowDown": {
                              return "↓";
                            }
                            case "ArrowLeft": {
                              return "←";
                            }
                            case "ArrowRight": {
                              return "→";
                            }
                            default: {
                              return key;
                            }
                          }
                        })
                        .join(" + ")
                    : "None"}
                </SidebarMenuButton>
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
