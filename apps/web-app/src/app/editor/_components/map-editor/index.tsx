import { Suspense } from 'react'

import { SidebarInset, SidebarProvider } from '@acme/ui/sidebar'
import { Skeleton } from '@acme/ui/skeleton'

import { Presence } from '@acme/db/supabase/client'
import { DebugSidebarLeft } from '~/components/debug-sidebar-left/sidebar'
import { DebugSidebarRight } from '~/components/debug-sidebar-right/sidebar'
import { GameCanvas } from '~/components/game/game-canvas'
import { GameCommandMenu } from '~/components/game/game-command-menu'
import { GameContextMenu } from '~/components/game/game-context-menu'
import { GameToolbar } from '~/components/game/game-toolbar'
import { NPCInteractionManager } from '~/components/npc-interaction-manager'
import { DebugStoreProvider } from '~/providers/debug-provider'
import { GameProvider } from '~/providers/game-provider'
import { MapContent } from './map-content'

function MapLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Skeleton className="h-32 w-96" />
    </div>
  )
}
export function MapEditor({ mapId }: { mapId: string }) {
  // const cookieStore = await cookies();
  // const defaultOpen =
  //   cookieStore.get("sidebar:state")?.value === "true" ?? true;

  return (
    <Suspense fallback={<MapLoading />}>
      <DebugStoreProvider>
        <GameProvider>
          <SidebarProvider defaultOpen={false}>
            <DebugSidebarLeft />
            <SidebarInset>
              <GameContextMenu>
                <div className="bg-background fixed inset-14">
                  <GameCanvas />
                </div>
              </GameContextMenu>
              <NPCInteractionManager />
              <GameToolbar />
              <GameCommandMenu />
            </SidebarInset>
            <SidebarProvider defaultOpen={false}>
              <DebugSidebarRight />
            </SidebarProvider>
          </SidebarProvider>
        </GameProvider>
      </DebugStoreProvider>
      <MapContent mapId={mapId} />
      <Presence id={mapId} />
    </Suspense>
  )
}
