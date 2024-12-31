"use client";

import { useEffect, useState } from "react";
import { query } from "bitecs";
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

import {
  BattleState,
  DebugMetrics,
  InputState,
  Player,
  Position,
} from "~/lib/ecs/components";
import { useGameEngine } from "~/lib/store/game-engine";

interface MetricsState {
  gridX: number;
  gridY: number;
  isActive: boolean;
  currentTurn: "player" | "enemy" | null;
  componentCounts: {
    hostileNpc: number;
    inBattle: number;
    movement: number;
    npc: number;
    npcInteraction: number;
    player: number;
    position: number;
  };
}

export function ECSStatus() {
  const engine = useGameEngine((state) => state.engine);
  const [metrics, setMetrics] = useState<MetricsState | null>(null);

  useEffect(() => {
    if (!engine) return;

    function updateMetrics() {
      if (!engine) return;

      // Get the metrics entity
      const [metricsEntity] = query(engine.world, [DebugMetrics]);
      if (!metricsEntity) return;

      // Get player position from the first player entity
      const playerEntities = query(engine.world, [Player, Position]);
      const playerEid = playerEntities[0];
      if (!playerEid) return;

      const x = Position.x[playerEid] ?? 0;
      const y = Position.y[playerEid] ?? 0;
      const gridX = Math.round(x / 50);
      const gridY = Math.round(y / 50);

      // Get battle state from the first player entity
      const isActive = BattleState.isActive[playerEid] === 1;
      let currentTurn: "player" | "enemy" | null = null;
      if (isActive) {
        currentTurn = BattleState.turn[playerEid] === 0 ? "player" : "enemy";
      }

      // Get component counts from metrics
      const componentCounts = {
        hostileNpc: DebugMetrics.componentCounts.hostileNpc[metricsEntity] ?? 0,
        inBattle: DebugMetrics.componentCounts.inBattle[metricsEntity] ?? 0,
        movement: DebugMetrics.componentCounts.movement[metricsEntity] ?? 0,
        npc: DebugMetrics.componentCounts.npc[metricsEntity] ?? 0,
        npcInteraction:
          DebugMetrics.componentCounts.npcInteraction[metricsEntity] ?? 0,
        player: DebugMetrics.componentCounts.player[metricsEntity] ?? 0,
        position: DebugMetrics.componentCounts.position[metricsEntity] ?? 0,
      };

      setMetrics({
        componentCounts,
        currentTurn,
        gridX,
        gridY,
        isActive,
      });
    }

    // Update immediately
    updateMetrics();

    // Then update every 100ms
    const interval = setInterval(updateMetrics, 100);

    return () => {
      clearInterval(interval);
    };
  }, [engine]);

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
                Player Position [{metrics.gridX}, {metrics.gridY}]
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
                  Active: {metrics.isActive ? "Yes" : "No"}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  Turn: {metrics.currentTurn ?? "N/A"}
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
