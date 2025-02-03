import 'server-only'
import { HydrationBoundary, getApi } from '@acme/api/server'

import { MapsGrid } from './maps-grid'

export async function MapsGridServer() {
  const api = await getApi()
  void api.map.list.prefetch()

  return (
    <HydrationBoundary>
      <MapsGrid />
    </HydrationBoundary>
    // <HydrateClient>
    // <MapsGrid />
    // </HydrateClient>
  )
}
