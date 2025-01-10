"use client";

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@acme/ui/context-menu";
import { Icons } from "@acme/ui/icons";

import { useDebugStore } from "~/providers/debug-provider";
import { useGameStore } from "~/providers/game-store-provider";

interface GameContextMenuProps {
  children: React.ReactNode;
}

export function GameContextMenu({ children }: GameContextMenuProps) {
  const engine = useGameStore((state) => state.engine);
  const setSelectedEntityId = useDebugStore(
    (state) => state.setSelectedEntityId,
  );
  const toggleVisualization = useDebugStore(
    (state) => state.toggleVisualization,
  );
  const visualizations = useDebugStore((state) => state.visualizations);

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuLabel inset>Game Controls</ContextMenuLabel>
        <ContextMenuItem
          inset
          onSelect={() => {
            if (!engine) return;
            // TODO: Implement togglePause in GameEngine
            // engine.togglePause();
          }}
        >
          Toggle Pause
          <ContextMenuShortcut>P</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem
          inset
          onSelect={() => {
            if (!engine) return;
            // TODO: Implement reset in GameEngine
            // engine.reset();
          }}
        >
          Reset Game
          <ContextMenuShortcut>R</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />
        <ContextMenuLabel inset>Debug Tools</ContextMenuLabel>

        <ContextMenuItem
          inset
          onSelect={() => {
            setSelectedEntityId(null);
          }}
        >
          Deselect Entity
          <ContextMenuShortcut>Esc</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSub>
          <ContextMenuSubTrigger inset>
            <span className="flex items-center gap-2">
              <Icons.Settings size="sm" />
              <span>Debug Visualizations</span>
            </span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuCheckboxItem
              checked={visualizations.showBoundingBoxes}
              onSelect={() => toggleVisualization("showBoundingBoxes")}
            >
              Bounding Boxes
              <ContextMenuShortcut>⌘B</ContextMenuShortcut>
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem
              checked={visualizations.showCollisionPoints}
              onSelect={() => toggleVisualization("showCollisionPoints")}
            >
              Collision Points
              <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem
              checked={visualizations.showForceVectors}
              onSelect={() => toggleVisualization("showForceVectors")}
            >
              Force Vectors
              <ContextMenuShortcut>⌘F</ContextMenuShortcut>
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem
              checked={visualizations.showVelocityVectors}
              onSelect={() => toggleVisualization("showVelocityVectors")}
            >
              Velocity Vectors
              <ContextMenuShortcut>⌘V</ContextMenuShortcut>
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem
              checked={visualizations.showTriggerZones}
              onSelect={() => toggleVisualization("showTriggerZones")}
            >
              Trigger Zones
              <ContextMenuShortcut>⌘T</ContextMenuShortcut>
            </ContextMenuCheckboxItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}
