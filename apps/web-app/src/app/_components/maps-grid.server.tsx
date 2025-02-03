import { HydrationBoundary } from '@acme/api/client'
import { api } from '@acme/api/server'
import { MapsGrid } from './maps-grid.client'

export async function MapsGridServer() {
  await api.map.list.prefetch()

  return (
    <HydrationBoundary queryClient={api.queryClient}>
      <MapsGrid />
    </HydrationBoundary>
  )
}
