import Link from 'next/link'
import { Suspense } from 'react'

import { Button } from '@acme/ui/button'
import { Icons } from '@acme/ui/icons'
import { Skeleton } from '@acme/ui/skeleton'
import { H2 } from '@acme/ui/typography'

import { HydrationBoundary, getApi } from '@acme/api/server'
import { EditorTabs } from './_components/editor-tabs'
import { searchParamsCache } from './search-params'

function EditorLoading() {
  return (
    <div className="flex h-screen flex-col">
      <Skeleton className="h-32 w-96" />
    </div>
  )
}

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ maps: string[] }>
}) {
  const { maps } = await searchParamsCache.parse(searchParams)
  const api = await getApi()
  void api.map.list.prefetch()

  if (maps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Icons.GalleryVerticalEnd size="xl" variant="muted" />
        <H2>No maps open</H2>
        <Button variant="outline" asChild>
          <Link href="/">
            <Icons.ArrowLeft size="sm" />
            Back to Gallery
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <Suspense fallback={<EditorLoading />}>
        <HydrationBoundary>
          <EditorTabs />
        </HydrationBoundary>
      </Suspense>
    </div>
  )
}
