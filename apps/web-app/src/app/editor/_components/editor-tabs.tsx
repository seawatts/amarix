'use client'

import { useQueryState } from 'nuqs'
import { useCallback, useState } from 'react'

import { Button, buttonVariants } from '@acme/ui/button'
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
import { cn } from '@acme/ui/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@acme/ui/tabs'

import { api } from '@acme/api/client'
import { searchParams } from '../search-params'
import { MapEditor } from './map-editor'

interface EditorTabProps {
  mapId: string
  isPending: boolean
  onClose: (mapId: string) => void
}

function EditorTab({ mapId, isPending, onClose }: EditorTabProps) {
  const handleClose = useCallback(
    (event: React.MouseEvent | React.KeyboardEvent) => {
      event.stopPropagation()
      if (!isPending) {
        onClose(mapId)
      }
    },
    [isPending, mapId, onClose],
  )

  return (
    <TabsTrigger key={mapId} value={mapId} className="group">
      <div className="flex items-center gap-2">
        <span className="mr-8 truncate group-hover:mr-0">{mapId}</span>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        {/* biome-ignore lint/a11y/useFocusableInteractive: <explanation> */}
        <span
          // biome-ignore lint/a11y/useSemanticElements: <explanation>
          role="button"
          aria-label="Close tab"
          className={cn(
            buttonVariants({
              size: 'xs',
              variant: 'ghost',
            }),
            'hidden rounded-sm group-hover:flex',
          )}
          onClick={handleClose}
          // disabled={isPending}
        >
          {isPending ? <Icons.Spinner size="xs" /> : <Icons.X size="xs" />}
          <span className="sr-only">Close tab</span>
        </span>
      </div>
    </TabsTrigger>
  )
}

export function EditorTabs() {
  const [maps] = api.map.list.useSuspenseQuery()
  const [openMapIds, setOpenMapIds] = useQueryState('maps', searchParams.maps)
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [search, setSearch] = useState('')

  const handleCloseTab = useCallback(
    (mapId: string) => {
      void setOpenMapIds(openMapIds.filter((id) => id !== mapId)).catch(
        console.error,
      )
    },
    [openMapIds, setOpenMapIds],
  )

  const handleTabChange = useCallback(
    (value: string) => {
      void setOpenMapIds([
        value,
        ...openMapIds.filter((id) => id !== value),
      ]).catch(console.error)
    },
    [openMapIds, setOpenMapIds],
  )

  const handleAddMap = useCallback(
    (mapId: string) => {
      void setOpenMapIds([mapId, ...openMapIds]).catch(console.error)
      setIsCommandOpen(false)
    },
    [openMapIds, setOpenMapIds],
  )

  const filteredMaps = search
    ? maps.filter(
        (map) =>
          map.name.toLowerCase().includes(search.toLowerCase()) &&
          !openMapIds.includes(map.id),
      )
    : maps.filter((map) => !openMapIds.includes(map.id))

  if (openMapIds.length === 0) {
    return null
  }

  return (
    <>
      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <Command>
          <CommandInput
            placeholder="Search maps..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No maps found.</CommandEmpty>
            <CommandGroup heading="Available Maps">
              {filteredMaps.map((map) => (
                <CommandItem key={map.id} onSelect={() => handleAddMap(map.id)}>
                  <Icons.GalleryVerticalEnd size="sm" />
                  <span className="ml-2">{map.name}</span>
                  <span className="text-muted-foreground ml-auto text-xs">
                    {map.updatedAt?.toLocaleDateString() ?? 'Never'}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

      <Tabs
        value={openMapIds[0]}
        className="flex-1"
        onValueChange={handleTabChange}
      >
        <div className="bg-background flex items-center justify-between border-b px-4 py-2">
          <TabsList>
            {openMapIds.map((mapId) => (
              <EditorTab
                key={mapId}
                mapId={mapId}
                isPending={false}
                onClose={handleCloseTab}
              />
            ))}
          </TabsList>
          <Button
            onClick={() => setIsCommandOpen(true)}
            variant="ghost"
            size="sm"
          >
            <Icons.Plus size="sm" />
            <span className="sr-only">Open map selector</span>
          </Button>
        </div>

        {openMapIds.map((mapId: string) => (
          <TabsContent key={mapId} value={mapId} className="flex-1 p-0">
            <MapEditor mapId={mapId} />
          </TabsContent>
        ))}
      </Tabs>
    </>
  )
}
