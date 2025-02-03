import { HydrationBoundary } from '@acme/api/client'
import { api } from '@acme/api/server'

import { EditorTabs } from './editor-tabs.client'

export async function EditorTabsServer() {
  await api.map.list.prefetch()

  return (
    <HydrationBoundary queryClient={api.queryClient}>
      <EditorTabs />
    </HydrationBoundary>
  )
}
