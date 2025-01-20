"use client";

import { useState } from "react";
import { query } from "bitecs";
import { useTheme } from "next-themes";

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
import { Camera, CurrentPlayer, Debug } from "~/lib/ecs/components";
import {
  createCamera,
  createGround,
  createHostileNPC,
  createNPC,
  createPlayer,
  createTriggerZone,
} from "~/lib/ecs/entities";
import { useDebugStore } from "~/providers/debug-provider";
import { useGame } from "~/providers/game-provider";

export function GameCommandMenu() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const engine = useGame((state) => state.engine);
  const entities = useDebugStore((state) => state.metrics?.entities);
  const isDebugging = useDebugStore((state) => state.isDebugging);
  const isPaused = useDebugStore((state) => state.isPaused);
  const systems = useDebugStore((state) => state.systems);
  const toggleSystemPause = useDebugStore((state) => state.toggleSystemPause);
  const setIsDebugging = useDebugStore((state) => state.setIsDebugging);
  const selectedEntityId = useDebugStore((state) => state.selectedEntityId);
  const setSelectedEntityId = useDebugStore(
    (state) => state.setSelectedEntityId,
  );
  const toggleSidebarSection = useDebugStore(
    (state) => state.toggleSidebarSection,
  );
  const sidebar = useSidebar();
  const { setTheme, theme } = useTheme();

  // Filter entities and systems based on search
  const filteredEntities = search
    ? entities?.filter((entity) => {
        const name = entity.name ?? `Entity ${entity.id}`;
        return name.toLowerCase().includes(search.toLowerCase());
      })
    : [];

  const systemNames = Object.entries(systems);
  const filteredSystems = search
    ? systemNames.filter(([name]) =>
        name.toLowerCase().includes(search.toLowerCase()),
      )
    : [];

  useHotkeys({
    "Alt+1": () => {
      toggleSidebarSection("performance");
    },
    "Alt+2": () => {
      toggleSidebarSection("ecs");
    },
    "Alt+3": () => {
      toggleSidebarSection("systems");
    },
    "Alt+4": () => {
      toggleSidebarSection("visualizations");
    },
    Escape: () => {
      setOpen(false);
    },
    "Meta+b": () => {
      sidebar.toggleSidebar();
    },
    "Meta+f": () => {
      if (!engine) return;
      // engine.toggleFullscreen();
      setOpen(false);
    },
    "Meta+k": () => {
      setOpen((open) => !open);
    },
    "Meta+p": () => {
      if (!engine) return;
      engine.stop();
      setOpen(false);
    },
    "Meta+r": () => {
      if (!engine) return;
      engine.reset();
      setOpen(false);
    },
    "Meta+t": () => {
      setTheme(theme === "light" ? "dark" : "light");
      setOpen(false);
    },
  });

  const commands = [
    {
      group: "Game",
      items: [
        {
          icon: isPaused ? (
            <Icons.Play size="sm" />
          ) : (
            <Icons.CircleStop size="sm" />
          ),
          id: "toggle-pause",
          label: isPaused ? "Resume Game" : "Pause Game",
          onSelect: () => {
            if (!engine) return;
            engine.togglePause();
            setOpen(false);
          },
          shortcut: ["p"],
        },
        {
          icon: <Icons.Eye size="sm" />,
          id: "toggle-camera-mode",
          label: "Toggle Camera Mode (Free/Target)",
          onSelect: () => {
            if (!engine?.world) return;
            const cameraEntities = query(engine.world, [Camera]);
            const cameraEid = cameraEntities[0];
            if (!cameraEid) return;

            // Toggle between free camera and target mode
            const currentTarget = Camera.target[cameraEid];
            if (currentTarget) {
              Camera.target[cameraEid] = 0; // Remove target to enable free camera
            } else {
              // Find player entity to target
              const playerEntities = query(engine.world, [CurrentPlayer]);
              const playerEid = playerEntities[0];
              if (playerEid) {
                Camera.target[cameraEid] = playerEid;
              }
            }
            setOpen(false);
          },
          shortcut: ["c"],
        },
        {
          icon: <Icons.Settings size="sm" />,
          id: "toggle-debug-mode",
          label: "Toggle Debug Mode",
          onSelect: () => {
            setIsDebugging(!isDebugging);

            if (!engine?.world) return;
            const debugEntities = query(engine.world, [Debug]);
            const debugEid = debugEntities[0];
            if (debugEid) {
              Debug.isPaused[debugEid] = Debug.isPaused[debugEid] ? 0 : 1;
            }
            setOpen(false);
          },
          shortcut: ["d"],
        },
        {
          icon: <Icons.ListPlus size="sm" />,
          id: "toggle-wireframes",
          label: "Toggle Wireframes",
          onSelect: () => {
            if (!engine?.world) return;
            const debugEntities = query(engine.world, [Debug]);
            const debugEid = debugEntities[0];
            if (debugEid) {
              Debug.showBoundingBox[debugEid] = Debug.showBoundingBox[debugEid]
                ? 0
                : 1;
            }
            setOpen(false);
          },
          shortcut: ["w"],
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
            engine.reset();
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
              console.error("Error toggling fullscreen:", error);
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
        {
          icon: <Icons.SunMedium size="sm" />,
          id: "toggle-theme",
          label: "Toggle Theme",
          onSelect: () => {
            setTheme(theme === "light" ? "dark" : "light");
            setOpen(false);
          },
          shortcut: ["⌘", "t"],
        },
        {
          icon: <Icons.BarChart2 size="sm" />,
          id: "toggle-performance-section",
          label: "Toggle Performance Section",
          onSelect: () => {
            toggleSidebarSection("performance");
            setOpen(false);
          },
          shortcut: ["⌘", "1"],
        },
        {
          icon: <Icons.CircleDot size="sm" />,
          id: "toggle-ecs-section",
          label: "Toggle ECS Section",
          onSelect: () => {
            toggleSidebarSection("ecs");
            setOpen(false);
          },
          shortcut: ["⌘", "2"],
        },
        {
          icon: <Icons.Settings size="sm" />,
          id: "toggle-systems-section",
          label: "Toggle Systems Section",
          onSelect: () => {
            toggleSidebarSection("systems");
            setOpen(false);
          },
          shortcut: ["⌘", "3"],
        },
        {
          icon: <Icons.Eye size="sm" />,
          id: "toggle-visualizations-section",
          label: "Toggle Visualizations Section",
          onSelect: () => {
            toggleSidebarSection("visualizations");
            setOpen(false);
          },
          shortcut: ["⌘", "4"],
        },
      ],
    },
    {
      group: "Edit",
      items: [
        {
          icon: <Icons.ListPlus size="sm" />,
          id: "create-prefab",
          label: "Create Prefab from Selection",
          onSelect: () => {
            if (!engine?.world) return;
            if (selectedEntityId) {
              // TODO: Implement prefab creation
              console.log("Creating prefab from entity:", selectedEntityId);
            }
            setOpen(false);
          },
          shortcut: ["⌘", "s"],
        },
        {
          icon: <Icons.MessageSquareText size="sm" />,
          id: "add-comment",
          label: "Add Comment",
          onSelect: () => {
            if (!engine?.world) return;
            if (selectedEntityId) {
              // TODO: Implement comment system
              console.log("Adding comment to entity:", selectedEntityId);
            }
            setOpen(false);
          },
          shortcut: ["⌘", "/"],
        },
        {
          icon: <Icons.ArrowLeft size="sm" />,
          id: "undo",
          label: "Undo",
          onSelect: () => {
            if (!engine?.world) return;
            // TODO: Implement undo system
            console.log("Undo last action");
            setOpen(false);
          },
          shortcut: ["⌘", "z"],
        },
        {
          icon: <Icons.ArrowRight size="sm" />,
          id: "redo",
          label: "Redo",
          onSelect: () => {
            if (!engine?.world) return;
            // TODO: Implement redo system
            console.log("Redo last action");
            setOpen(false);
          },
          shortcut: ["⌘", "⇧", "z"],
        },
        {
          icon: <Icons.Sparkles size="sm" />,
          id: "ask-ai",
          label: "Ask AI Assistant",
          onSelect: () => {
            if (!engine?.world) return;
            // TODO: Implement AI assistant integration
            console.log("Opening AI assistant");
            setOpen(false);
          },
          shortcut: ["⌘", "k"],
        },
      ],
    },
    {
      group: "Create Entity",
      items: [
        {
          icon: <Icons.User size="sm" />,
          id: "create-player",
          label: "Create Player",
          onSelect: () => {
            if (!engine?.world) return;
            const canvas = document.querySelector("canvas");
            if (!canvas) return;
            const x = canvas.width / 2;
            const y = canvas.height / 2;
            const eid = createPlayer(engine.world, { x, y });
            setSelectedEntityId(eid);
            setOpen(false);
          },
          shortcut: ["p"],
        },
        {
          icon: <Icons.UsersRound size="sm" />,
          id: "create-npc",
          label: "Create NPC",
          onSelect: () => {
            if (!engine?.world) return;
            const canvas = document.querySelector("canvas");
            if (!canvas) return;
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const eid = createNPC(engine.world, { x, y });
            setSelectedEntityId(eid);
            setOpen(false);
          },
          shortcut: ["n"],
        },
        {
          icon: <Icons.CircleStop size="sm" />,
          id: "create-hostile-npc",
          label: "Create Hostile NPC",
          onSelect: () => {
            if (!engine?.world) return;
            const canvas = document.querySelector("canvas");
            if (!canvas) return;
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const eid = createHostileNPC(engine.world, { x, y });
            setSelectedEntityId(eid);
            setOpen(false);
          },
          shortcut: ["h"],
        },
        {
          icon: <Icons.Eye size="sm" />,
          id: "create-camera",
          label: "Create Camera",
          onSelect: () => {
            if (!engine?.world) return;
            const eid = createCamera(engine.world, {});
            setSelectedEntityId(eid);
            setOpen(false);
          },
          shortcut: ["c"],
        },
        {
          icon: <Icons.SquarePen size="sm" />,
          id: "create-ground",
          label: "Create Ground",
          onSelect: () => {
            if (!engine?.world) return;
            const canvas = document.querySelector("canvas");
            if (!canvas) return;
            const eid = createGround(engine.world, {
              height: 20,
              width: canvas.width,
              x: canvas.width / 2,
              y: canvas.height - 10,
            });
            setSelectedEntityId(eid);
            setOpen(false);
          },
          shortcut: ["g"],
        },
        {
          icon: <Icons.CircleDot size="sm" />,
          id: "create-trigger-zone",
          label: "Create Trigger Zone",
          onSelect: () => {
            if (!engine?.world) return;
            const canvas = document.querySelector("canvas");
            if (!canvas) return;
            const eid = createTriggerZone(engine.world, {
              actionId: Date.now(),
              cooldown: 0,
              height: 100,
              isRepeatable: true,
              type: "battle",
              width: 100,
              x: canvas.width / 2,
              y: canvas.height / 2,
            });
            setSelectedEntityId(eid);
            setOpen(false);
          },
          shortcut: ["t"],
        },
      ],
    },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput
          placeholder="Type a command or search..."
          value={search}
          onValueChange={setSearch}
        />
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
          {search && filteredSystems.length > 0 && (
            <CommandGroup heading="Systems">
              {filteredSystems.map(([name, state]) => (
                <CommandItem
                  key={name}
                  onSelect={() => {
                    toggleSystemPause(name);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  {state.isPaused ? (
                    <Icons.Play size="sm" />
                  ) : (
                    <Icons.CircleStop size="sm" />
                  )}
                  <span>
                    {state.isPaused
                      ? `Resume ${name} System`
                      : `Pause ${name} System`}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {search && filteredEntities && filteredEntities.length > 0 && (
            <CommandGroup heading="Entities">
              {filteredEntities.map((entity) => (
                <>
                  <CommandItem
                    key={`${entity.id}-select-entity`}
                    onSelect={() => {
                      setSelectedEntityId(entity.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Icons.CircleDot size="sm" />
                    <span>Select {entity.name ?? `Entity ${entity.id}`}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      ID: {entity.id}
                    </span>
                  </CommandItem>
                  <CommandItem
                    key={`${entity.id}-camera-to-entity`}
                    onSelect={() => {
                      if (!engine?.world) return;
                      const cameraEntities = query(engine.world, [Camera]);
                      const cameraEid = cameraEntities[0];
                      if (!cameraEid) return;
                      Camera.target[cameraEid] = entity.id;
                      setOpen(false);
                    }}
                  >
                    <Icons.ArrowRight size="sm" />
                    <span>
                      Move Camera to {entity.name ?? `Entity ${entity.id}`}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      ID: {entity.id}
                    </span>
                  </CommandItem>
                </>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
