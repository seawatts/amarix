'use client'

import { query } from 'bitecs'
import { useTheme } from 'next-themes'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useServerAction } from 'zsa-react'

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@acme/ui/command'
import { Icons } from '@acme/ui/icons'
import { useSidebar } from '@acme/ui/sidebar'

import {
  listMapsAction,
  loadMapAction,
  saveMapAction,
} from '~/components/game/actions'
import { useHotkeys } from '~/hooks/use-hotkeys'
import { Camera, CurrentPlayer, Debug } from '~/lib/ecs/components'
import {
  createCamera,
  createGround,
  createHostileNPC,
  createNPC,
  createPlayer,
  createTriggerZone,
} from '~/lib/ecs/entities'
import { serializeWorld } from '~/lib/ecs/map-serialization'
import type { MapMetadata } from '~/lib/ecs/types'
import { createGameWorld } from '~/lib/ecs/world'
import { useDebugStore } from '~/providers/debug-provider'
import { useGame } from '~/providers/game-provider'

export function GameCommandMenu() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [maps, setMaps] = useState<MapMetadata[]>([])
  const engine = useGame((state) => state.engine)
  // const currentMap = useGame((state) => state.currentMap)
  // const _isDirty = useGame((state) => state.isDirty)
  // const setCurrentMap = useGame((state) => state.setCurrentMap)
  const entities = useDebugStore((state) => state.metrics?.entities)
  const isDebugging = useDebugStore((state) => state.isDebugging)
  const isPaused = useDebugStore((state) => state.isPaused)
  const systems = useDebugStore((state) => state.systems)
  const toggleSystemPause = useDebugStore((state) => state.toggleSystemPause)
  const setIsDebugging = useDebugStore((state) => state.setIsDebugging)
  const selectedEntityId = useDebugStore((state) => state.selectedEntityId)
  const setSelectedEntityId = useDebugStore(
    (state) => state.setSelectedEntityId,
  )
  const toggleSidebarSection = useDebugStore(
    (state) => state.toggleSidebarSection,
  )
  const sidebar = useSidebar()
  const saveMap = useServerAction(saveMapAction)
  const { setTheme, theme } = useTheme()

  // Filter entities and systems based on search
  const filteredEntities =
    search && entities
      ? entities.filter((entity) => {
          const name = entity.name ?? `Entity ${entity.id}`
          return name.toLowerCase().includes(search.toLowerCase())
        })
      : []

  const systemNames = Object.entries(systems)
  const filteredSystems = search
    ? systemNames.filter(([name]) =>
        name.toLowerCase().includes(search.toLowerCase()),
      )
    : []

  const filteredMaps = search
    ? maps.filter((map) =>
        map.name.toLowerCase().includes(search.toLowerCase()),
      )
    : []

  const handleLoadMaps = useCallback(async () => {
    try {
      const [data, error] = await listMapsAction({ filter: undefined })
      if (error) {
        throw new Error(error.message)
      }
      setMaps(data)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to list maps',
      )
    }
  }, [])

  const handleSaveMap = useCallback(async () => {
    if (!engine?.world) return

    try {
      serializeWorld(engine.world)
      // const [, error] = await saveMap.execute({
      //   metadata: {
      //     author: currentMap?.author ?? 'Anonymous',
      //     createdAt: currentMap?.createdAt ?? new Date().toISOString(),
      //     description: currentMap?.description ?? '',
      //     dimensions: currentMap?.dimensions ?? { height: 1000, width: 1000 },
      //     isTemplate: currentMap?.isTemplate ?? false,
      //     name: currentMap?.name ?? 'untitled-map',
      //     schemaVersion: 1,
      //     tags: currentMap?.tags ?? [],
      //     thumbnailUrl: currentMap?.thumbnailUrl,
      //     updatedAt: new Date().toISOString(),
      //     version: currentMap?.version ?? 'v1',
      //   },
      //   serializedWorld,
      // })
      // if (error) {
      // throw new Error(error.message)
      // }
      toast.success('Map saved successfully')
    } catch (error) {
      console.error('Error saving map', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save map')
    }
  }, [engine?.world])

  const handleLoadMap = useCallback(
    async (filePath: string) => {
      if (!engine?.world) return

      try {
        const [data, error] = await loadMapAction({ filePath })
        if (error) {
          throw new Error(error.message)
        }
        // setCurrentMap(data.metadata)
        return data
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to load map',
        )
      }
    },
    [engine?.world],
  )

  useHotkeys({
    'Alt+1': () => {
      toggleSidebarSection('performance')
    },
    'Alt+2': () => {
      toggleSidebarSection('ecs')
    },
    'Alt+3': () => {
      toggleSidebarSection('systems')
    },
    'Alt+4': () => {
      toggleSidebarSection('visualizations')
    },
    Escape: () => {
      setOpen(false)
    },
    'Meta+b': () => {
      sidebar.toggleSidebar()
    },
    'Meta+f': () => {
      if (!engine) return
      // engine.toggleFullscreen();
      setOpen(false)
    },
    'Meta+k': () => {
      setOpen((open) => !open)
    },
    'Meta+l': () => {
      void handleLoadMaps()
        .then(() => {
          setOpen(true)
        })
        .catch((error) => {
          toast.error(
            error instanceof Error ? error.message : 'Failed to list maps',
          )
        })
    },
    'Meta+p': () => {
      if (!engine) return
      engine.stop()
      setOpen(false)
    },
    'Meta+r': () => {
      if (!engine) return
      const world = createGameWorld()
      engine.reset(world)
      setOpen(false)
    },
    'Meta+s': () => {
      void handleSaveMap().then(() => {
        setOpen(false)
      })
    },
    'Meta+t': () => {
      setTheme(theme === 'light' ? 'dark' : 'light')
      setOpen(false)
    },
  })

  const commands = [
    {
      group: 'Game',
      items: [
        {
          icon: isPaused ? (
            <Icons.Play size="sm" />
          ) : (
            <Icons.CircleStop size="sm" />
          ),
          id: 'toggle-pause',
          label: isPaused ? 'Resume Game' : 'Pause Game',
          onSelect: () => {
            if (!engine) return
            engine.togglePause()
            setOpen(false)
          },
          shortcut: ['p'],
        },
        {
          icon: saveMap.isPending ? (
            <Icons.Spinner size="sm" />
          ) : (
            <Icons.Download size="sm" />
          ),
          id: 'save-map',
          label: 'Save Map',
          onSelect: () => {
            void handleSaveMap().then(() => {
              // setOpen(false);
            })
          },
          shortcut: ['⌘', 's'],
        },
        {
          icon: <Icons.Upload size="sm" />,
          id: 'load-map',
          label: 'Load Map',
          onSelect: () => {
            void handleLoadMaps().catch((error) => {
              toast.error(
                error instanceof Error ? error.message : 'Failed to list maps',
              )
            })
          },
          shortcut: ['⌘', 'l'],
        },
        {
          icon: <Icons.Eye size="sm" />,
          id: 'toggle-camera-mode',
          label: 'Toggle Camera Mode (Free/Target)',
          onSelect: () => {
            if (!engine?.world) return
            const cameraEntities = query(engine.world, [Camera])
            const cameraEid = cameraEntities[0]
            if (!cameraEid) return

            // Toggle between free camera and target mode
            const currentTarget = Camera.target[cameraEid]
            if (currentTarget) {
              Camera.target[cameraEid] = 0 // Remove target to enable free camera
            } else {
              // Find player entity to target
              const playerEntities = query(engine.world, [CurrentPlayer])
              const playerEid = playerEntities[0]
              if (playerEid) {
                Camera.target[cameraEid] = playerEid
              }
            }
            setOpen(false)
          },
          shortcut: ['c'],
        },
        {
          icon: <Icons.Settings size="sm" />,
          id: 'toggle-debug-mode',
          label: 'Toggle Debug Mode',
          onSelect: () => {
            setIsDebugging(!isDebugging)

            if (!engine?.world) return
            const debugEntities = query(engine.world, [Debug])
            const debugEid = debugEntities[0]
            if (debugEid) {
              Debug.isPaused[debugEid] = Debug.isPaused[debugEid] ? 0 : 1
            }
            setOpen(false)
          },
          shortcut: ['d'],
        },
        {
          icon: <Icons.ListPlus size="sm" />,
          id: 'toggle-wireframes',
          label: 'Toggle Wireframes',
          onSelect: () => {
            if (!engine?.world) return
            const debugEntities = query(engine.world, [Debug])
            const debugEid = debugEntities[0]
            if (debugEid) {
              Debug.showBoundingBox[debugEid] = Debug.showBoundingBox[debugEid]
                ? 0
                : 1
            }
            setOpen(false)
          },
          shortcut: ['w'],
        },
        {
          icon: <Icons.CircleStop size="sm" />,
          id: 'deselect-entity',
          label: 'Deselect Entity',
          onSelect: () => {
            setSelectedEntityId(null)
            setOpen(false)
          },
          shortcut: ['Esc'],
        },
        {
          icon: <Icons.ArrowLeft size="sm" />,
          id: 'reset-game',
          label: 'Reset Game',
          onSelect: () => {
            if (!engine) return
            // TODO: Implement reset in GameEngine
            const world = createGameWorld()
            engine.reset(world)
            setOpen(false)
          },
          shortcut: ['r'],
        },
      ],
    },
    {
      group: 'View',
      items: [
        {
          icon: <Icons.Maximize size="sm" />,
          id: 'toggle-fullscreen',
          label: 'Toggle Fullscreen',
          onSelect: async () => {
            try {
              await (document.fullscreenElement
                ? document.exitFullscreen()
                : document.documentElement.requestFullscreen())
            } catch (error) {
              console.error('Error toggling fullscreen:', error)
            } finally {
              setOpen(false)
            }
          },
          shortcut: ['f'],
        },
        {
          icon: <Icons.ArrowBigUp size="sm" />,
          id: 'toggle-debug-panel',
          label: 'Show / Hide Debug Panel',
          onSelect: () => {
            sidebar.toggleSidebar()
            setOpen(false)
          },
          shortcut: ['⌘', 'b'],
        },
        {
          icon: <Icons.SunMedium size="sm" />,
          id: 'toggle-theme',
          label: 'Toggle Theme',
          onSelect: () => {
            setTheme(theme === 'light' ? 'dark' : 'light')
            setOpen(false)
          },
          shortcut: ['⌘', 't'],
        },
        {
          icon: <Icons.BarChart2 size="sm" />,
          id: 'toggle-performance-section',
          label: 'Toggle Performance Section',
          onSelect: () => {
            toggleSidebarSection('performance')
            setOpen(false)
          },
          shortcut: ['⌘', '1'],
        },
        {
          icon: <Icons.CircleDot size="sm" />,
          id: 'toggle-ecs-section',
          label: 'Toggle ECS Section',
          onSelect: () => {
            toggleSidebarSection('ecs')
            setOpen(false)
          },
          shortcut: ['⌘', '2'],
        },
        {
          icon: <Icons.Settings size="sm" />,
          id: 'toggle-systems-section',
          label: 'Toggle Systems Section',
          onSelect: () => {
            toggleSidebarSection('systems')
            setOpen(false)
          },
          shortcut: ['⌘', '3'],
        },
        {
          icon: <Icons.Eye size="sm" />,
          id: 'toggle-visualizations-section',
          label: 'Toggle Visualizations Section',
          onSelect: () => {
            toggleSidebarSection('visualizations')
            setOpen(false)
          },
          shortcut: ['⌘', '4'],
        },
      ],
    },
    {
      group: 'Edit',
      items: [
        {
          icon: <Icons.ListPlus size="sm" />,
          id: 'create-prefab',
          label: 'Create Prefab from Selection',
          onSelect: () => {
            if (!engine?.world) return
            if (selectedEntityId) {
              // TODO: Implement prefab creation
              console.log('Creating prefab from entity:', selectedEntityId)
            }
            setOpen(false)
          },
          shortcut: ['⌘', 's'],
        },
        {
          icon: <Icons.MessageSquareText size="sm" />,
          id: 'add-comment',
          label: 'Add Comment',
          onSelect: () => {
            if (!engine?.world) return
            if (selectedEntityId) {
              // TODO: Implement comment system
              console.log('Adding comment to entity:', selectedEntityId)
            }
            setOpen(false)
          },
          shortcut: ['⌘', '/'],
        },
        {
          icon: <Icons.ArrowLeft size="sm" />,
          id: 'undo',
          label: 'Undo',
          onSelect: () => {
            if (!engine?.world) return
            // TODO: Implement undo system
            console.log('Undo last action')
            setOpen(false)
          },
          shortcut: ['⌘', 'z'],
        },
        {
          icon: <Icons.ArrowRight size="sm" />,
          id: 'redo',
          label: 'Redo',
          onSelect: () => {
            if (!engine?.world) return
            // TODO: Implement redo system
            console.log('Redo last action')
            setOpen(false)
          },
          shortcut: ['⌘', '⇧', 'z'],
        },
        {
          icon: <Icons.Sparkles size="sm" />,
          id: 'ask-ai',
          label: 'Ask AI Assistant',
          onSelect: () => {
            if (!engine?.world) return
            // TODO: Implement AI assistant integration
            console.log('Opening AI assistant')
            setOpen(false)
          },
          shortcut: ['⌘', 'k'],
        },
      ],
    },
    {
      group: 'Create Entity',
      items: [
        {
          icon: <Icons.User size="sm" />,
          id: 'create-player',
          label: 'Create Player',
          onSelect: () => {
            if (!engine?.world) return
            const canvas = document.querySelector('canvas')
            if (!canvas) return
            const x = canvas.width / 2
            const y = canvas.height / 2
            const eid = createPlayer(engine.world, { x, y })
            setSelectedEntityId(eid)
            setOpen(false)
          },
          shortcut: ['p'],
        },
        {
          icon: <Icons.UsersRound size="sm" />,
          id: 'create-npc',
          label: 'Create NPC',
          onSelect: () => {
            if (!engine?.world) return
            const canvas = document.querySelector('canvas')
            if (!canvas) return
            const x = Math.random() * canvas.width
            const y = Math.random() * canvas.height
            const eid = createNPC(engine.world, { x, y })
            setSelectedEntityId(eid)
            setOpen(false)
          },
          shortcut: ['n'],
        },
        {
          icon: <Icons.CircleStop size="sm" />,
          id: 'create-hostile-npc',
          label: 'Create Hostile NPC',
          onSelect: () => {
            if (!engine?.world) return
            const canvas = document.querySelector('canvas')
            if (!canvas) return
            const x = Math.random() * canvas.width
            const y = Math.random() * canvas.height
            const eid = createHostileNPC(engine.world, { x, y })
            setSelectedEntityId(eid)
            setOpen(false)
          },
          shortcut: ['h'],
        },
        {
          icon: <Icons.Eye size="sm" />,
          id: 'create-camera',
          label: 'Create Camera',
          onSelect: () => {
            if (!engine?.world) return
            const eid = createCamera(engine.world, {})
            setSelectedEntityId(eid)
            setOpen(false)
          },
          shortcut: ['c'],
        },
        {
          icon: <Icons.SquarePen size="sm" />,
          id: 'create-ground',
          label: 'Create Ground',
          onSelect: () => {
            if (!engine?.world) return
            const canvas = document.querySelector('canvas')
            if (!canvas) return
            const eid = createGround(engine.world, {
              height: 20,
              width: canvas.width,
              x: canvas.width / 2,
              y: canvas.height - 10,
            })
            setSelectedEntityId(eid)
            setOpen(false)
          },
          shortcut: ['g'],
        },
        {
          icon: <Icons.CircleDot size="sm" />,
          id: 'create-trigger-zone',
          label: 'Create Trigger Zone',
          onSelect: () => {
            if (!engine?.world) return
            const canvas = document.querySelector('canvas')
            if (!canvas) return
            const eid = createTriggerZone(engine.world, {
              actionId: Date.now(),
              cooldown: 0,
              height: 100,
              isRepeatable: true,
              type: 'battle',
              width: 100,
              x: canvas.width / 2,
              y: canvas.height / 2,
            })
            setSelectedEntityId(eid)
            setOpen(false)
          },
          shortcut: ['t'],
        },
      ],
    },
    {
      group: 'Maps',
      items: filteredMaps.map((map) => ({
        icon: <Icons.ListFilter size="sm" />,
        id: `load-map-${map.name}`,
        label: map.name,
        onSelect: () => {
          void handleLoadMap(
            `${map.name}-${map.version}-${map.updatedAt.replaceAll(/[:.]/g, '')}.map.json`,
          ).then(() => {
            setOpen(false)
          })
        },
      })),
    },
  ]

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
                  <kbd className="bg-muted text-muted-foreground pointer-events-none ml-auto inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
                    {'shortcut' in item &&
                      item.shortcut.map((shortcut) => (
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
                    toggleSystemPause(name)
                    setOpen(false)
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
          {search && filteredEntities.length > 0 && (
            <CommandGroup heading="Entities">
              {filteredEntities.map((entity) => (
                <div key={entity.id}>
                  <CommandItem
                    onSelect={() => {
                      setSelectedEntityId(entity.id)
                      setOpen(false)
                    }}
                    className="flex items-center gap-2"
                  >
                    <Icons.CircleDot size="sm" />
                    <span>Select {entity.name ?? `Entity ${entity.id}`}</span>
                    <span className="text-muted-foreground ml-auto text-xs">
                      ID: {entity.id}
                    </span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => {
                      if (!engine?.world) return
                      const cameraEntities = query(engine.world, [Camera])
                      const cameraEid = cameraEntities[0]
                      if (!cameraEid) return
                      Camera.target[cameraEid] = entity.id
                      setOpen(false)
                    }}
                  >
                    <Icons.ArrowRight size="sm" />
                    <span>
                      Move Camera to {entity.name ?? `Entity ${entity.id}`}
                    </span>
                    <span className="text-muted-foreground ml-auto text-xs">
                      ID: {entity.id}
                    </span>
                  </CommandItem>
                </div>
              ))}
            </CommandGroup>
          )}
          {search && filteredMaps.length > 0 && (
            <CommandGroup heading="Maps">
              {filteredMaps.map((map) => (
                <CommandItem
                  key={map.name}
                  // onSelect={() => {
                  //   void (async () => {
                  //     try {
                  //       await loadMap(`src/maps/${map.name}.map.json`);
                  //       setCurrentMap(map);
                  //       toast.success(`Loaded map: ${map.name}`);
                  //     } catch (error) {
                  //       toast.error(
                  //         error instanceof Error
                  //           ? error.message
                  //           : `Failed to load map: ${map.name}`,
                  //       );
                  //     }
                  //     setOpen(false);
                  //   })();
                  // }}
                  className="flex items-center gap-2"
                >
                  <Icons.GalleryVerticalEnd size="sm" />
                  <span>{map.name}</span>
                  <span className="text-muted-foreground ml-auto text-xs">
                    {new Date(map.updatedAt).toLocaleDateString()}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
