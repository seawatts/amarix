"use client";

import { useState } from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@acme/ui/command";
import { Icons } from "@acme/ui/icons";
import { useSidebar } from "@acme/ui/sidebar";

import { useHotkeys } from "~/hooks/use-hotkeys";
import { useDebugStore } from "~/providers/debug-provider";
import { useGameStore } from "~/providers/game-store-provider";

export function GameCommandMenu() {
  const [open, setOpen] = useState(false);
  const engine = useGameStore((state) => state.engine);
  const setSelectedEntityId = useDebugStore(
    (state) => state.setSelectedEntityId,
  );
  const sidebar = useSidebar();

  useHotkeys({
    Escape: () => {
      setOpen(false);
    },
    "Meta+b": () => {
      sidebar.toggleSidebar();
    },
    "Meta+k": () => {
      setOpen((open) => !open);
    },
  });

  const commands = [
    {
      group: "Game",
      items: [
        {
          icon: <Icons.Play size="sm" />,
          id: "toggle-pause",
          label: "Toggle Pause",
          onSelect: () => {
            if (!engine) return;
            // TODO: Implement togglePause in GameEngine
            setOpen(false);
          },
          shortcut: ["p"],
        },
        {
          icon: <Icons.CircleStop size="sm" />,
          id: "deselect-entity",
          label: "Deselect Entity",
          onSelect: () => {
            setSelectedEntityId(null);
            setOpen(false);
          },
          shortcut: ["Esc"],
        },
        {
          icon: <Icons.ArrowLeft size="sm" />,
          id: "reset-game",
          label: "Reset Game",
          onSelect: () => {
            if (!engine) return;
            // TODO: Implement reset in GameEngine
            setOpen(false);
          },
          shortcut: ["r"],
        },
      ],
    },
    {
      group: "View",
      items: [
        {
          icon: <Icons.Maximize size="sm" />,
          id: "toggle-fullscreen",
          label: "Toggle Fullscreen",
          onSelect: async () => {
            try {
              await (document.fullscreenElement
                ? document.exitFullscreen()
                : document.documentElement.requestFullscreen());
            } catch (error) {
              if (error instanceof Error) {
                console.error("Error toggling fullscreen:", error.message);
              }
            } finally {
              setOpen(false);
            }
          },
          shortcut: ["f"],
        },
        {
          icon: <Icons.ArrowBigUp size="sm" />,
          id: "toggle-debug-panel",
          label: "Show / Hide Debug Panel",
          onSelect: () => {
            sidebar.toggleSidebar();
            setOpen(false);
          },
          shortcut: ["⌘", "b"],
        },
      ],
    },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {commands.map(({ group, items }) => (
            <CommandGroup key={group} heading={group}>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={item.onSelect}
                  className="flex items-center gap-2"
                >
                  {item.icon}
                  <span>{item.label}</span>
                  <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    {item.shortcut.map((shortcut) => (
                      <span key={shortcut} className="uppercase">
                        {shortcut}
                      </span>
                    ))}
                  </kbd>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
