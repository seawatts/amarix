'use client'

import { useUser } from '@clerk/nextjs'
import debounce from 'lodash-es/debounce'
import { useEffect, useState } from 'react'

import { Cursor } from '@acme/ui/cursor'
import { Icons } from '@acme/ui/icons'
import { P } from '@acme/ui/typography'

import { usePresenceStore } from '@acme/db/supabase/client'
import { useBroadcast } from '@acme/db/supabase/client'
import type { BroadcastMessage } from '@acme/db/supabase/client'

// Predefined colors that work well with dark/light themes
const CURSOR_COLORS = [
  'hsl(47, 95%, 55%)', // yellow
  'hsl(271, 91%, 65%)', // purple
  'hsl(162, 47%, 50%)', // teal
  'hsl(338, 95%, 55%)', // pink
  'hsl(198, 95%, 55%)', // blue
  'hsl(25, 95%, 55%)', // orange
  'hsl(144, 95%, 35%)', // green
  'hsl(316, 95%, 45%)', // magenta
] as const

function generateColorFromUserId(userId: string): string {
  // Simple hash function to get a consistent number from the user ID
  let hash = 0
  for (let index_ = 0; index_ < userId.length; index_++) {
    const codePoint = userId.codePointAt(index_)
    // If codePoint is undefined, use a default value
    hash = (hash << 5) - hash + (codePoint ?? 0)
    hash = hash & hash // Convert to 32-bit integer
  }

  // Use the absolute value of the hash to index into our color array
  const index = Math.abs(hash) % CURSOR_COLORS.length
  return CURSOR_COLORS[index] as string
}

interface MouseMoveMessage extends BroadcastMessage {
  event: 'mouse_move'
  topic: string
  payload: {
    userId: string
    name: string
    color: string
    x: number
    y: number
  }
}

interface CursorPosition {
  x: number
  y: number
  lastUpdate: number
  userId: string
  name: string
  color: string
}

export function MapContent({ mapId }: { mapId: string }) {
  const onlineUsers = usePresenceStore((state) => state.onlineUsers)
  const [cursors, setCursors] = useState<Record<string, CursorPosition>>({})
  const user = useUser()

  const { send } = useBroadcast<MouseMoveMessage>({
    event: 'mouse_move',
    onMessage: (payload) => {
      const { userId, x, y, name, color } = payload
      if (!userId) return

      setCursors((previous) => ({
        ...previous,
        [userId]: {
          color,
          lastUpdate: Date.now(),
          name,
          userId,
          x,
          y,
        },
      }))
    },
    topic: mapId,
  })

  useEffect(() => {
    const handleMouseMove = debounce((event: MouseEvent) => {
      if (!user.user) return

      void send({
        color: generateColorFromUserId(user.user.id),
        name: user.user.emailAddresses[0]?.emailAddress ?? 'Unknown',
        userId: user.user.id,
        x: event.pageX + 21,
        y: event.pageY - 64, // Adjust for header/toolbar height
      })
    }, 0)

    globalThis.addEventListener('mousemove', handleMouseMove)

    return () => {
      handleMouseMove.cancel()
      globalThis.removeEventListener('mousemove', handleMouseMove)
    }
  }, [send, user])

  // Clean up cursors when users go offline
  useEffect(() => {
    if (!onlineUsers) return

    setCursors((previous) => {
      const newCursors = { ...previous }
      let hasChanges = false

      for (const [userId] of Object.entries(newCursors)) {
        if (!onlineUsers.has(userId)) {
          delete newCursors[userId]
          hasChanges = true
        }
      }

      return hasChanges ? newCursors : previous
    })
  }, [onlineUsers])

  return (
    <div className="relative flex h-full items-center justify-center">
      <P variant="muted">Editor content for map will go here</P>
      <div className="flex items-center gap-2">
        <Icons.User size="sm" />
        <span>{onlineUsers?.size ?? 0}</span>
      </div>

      {Object.entries(cursors).map(([userId, cursor]) => {
        if (cursor.userId === user.user?.id) return null
        return (
          <Cursor
            key={userId}
            x={cursor.x}
            y={cursor.y}
            name={cursor.name}
            color={cursor.color}
          />
        )
      })}
    </div>
  )
}
