'use client'

import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'

import { Button } from '@acme/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@acme/ui/card'
import { Icons } from '@acme/ui/icons'
import { cn } from '@acme/ui/lib/utils'
import { H2 } from '@acme/ui/typography'

import { api } from '@acme/api/client'
import { useSubscription } from '@acme/db/supabase/client'

// Animation variants for the cards
const cardVariants = {
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
}

export function MapsGrid() {
  const [maps, { refetch, isRefetching }] = api.map.list.useSuspenseQuery()

  useSubscription({
    event: '*',
    onDelete: () => {
      console.log('onDelete')
      void refetch()
    },
    onError: (error) => {
      console.error('Subscription error:', error)
    },
    onInsert: () => {
      console.log('onInsert')
      void refetch()
    },
    onStatusChange: (newStatus) => {
      console.log('Subscription status:', newStatus)
    },
    onUpdate: () => {
      console.log('onUpdate')
      void refetch()
    },
    table: 'maps',
  })

  if (maps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <Icons.GalleryVerticalEnd size="xl" variant="muted" />
        <H2>No maps found</H2>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="icon"
            aria-label="Refresh maps"
          >
            {isRefetching ? (
              <Icons.Spinner size="sm" />
            ) : (
              <Icons.RefreshCw size="sm" />
            )}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {maps.map((map) => (
            <motion.div
              key={map.id}
              layout
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layoutId={map.id}
            >
              <Link
                href={{
                  pathname: '/editor',
                  query: { maps: map.id },
                }}
                className="transition-transform hover:scale-[1.02]"
              >
                <Card
                  className={cn(
                    'flex h-full flex-col',
                    'hover:border-primary/50 hover:shadow-md',
                    'cursor-pointer transition-colors',
                  )}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{map.name}</CardTitle>
                      <Icons.ArrowRight
                        size="sm"
                        className="text-muted-foreground"
                      />
                    </div>
                    <CardDescription>
                      {map.description ?? 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex flex-wrap gap-2">
                      {map.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="text-muted-foreground text-sm">
                    Last updated{' '}
                    {map.updatedAt?.toLocaleDateString() ?? 'Never'}
                  </CardFooter>
                </Card>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
