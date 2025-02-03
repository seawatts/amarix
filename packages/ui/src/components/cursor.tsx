import { MousePointer2 } from 'lucide-react'

import { P } from '@acme/ui/typography'

export interface CursorProps {
  x: number
  y: number
  name: string
  color?: string
}

export function Cursor({ x, y, name, color = '#000' }: CursorProps) {
  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-[9999]"
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <div className="flex flex-col items-start gap-2">
        <div className="relative -ml-6">
          <MousePointer2
            className="absolute"
            size={24}
            color="white"
            strokeWidth={4}
          />
          <MousePointer2
            className="relative"
            size={24}
            color={color}
            strokeWidth={1.5}
            fill={color}
          />
        </div>

        <div
          className="rounded-md px-1.5 py-0.5"
          style={{ backgroundColor: color }}
        >
          <P className="text-xs whitespace-nowrap text-white">{name}</P>
        </div>
      </div>
    </div>
  )
}
