'use client'

import type { PropsWithChildren } from 'react'

import { Button } from '@acme/ui/button'
import { cn } from '@acme/ui/lib/utils'
import { Separator } from '@acme/ui/separator'
import { Switch } from '@acme/ui/switch'

interface FloatingToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function FloatingToolbarButton({
  icon,
  variant = 'ghost',
  ...props
}: React.HTMLAttributes<HTMLButtonElement> & {
  icon: React.ReactNode
  variant?: React.ComponentProps<typeof Button>['variant']
}) {
  return (
    <Button variant={variant} size="icon" className="rounded-xl" {...props}>
      {icon}
    </Button>
  )
}

export function FloatingToolbarSeparator() {
  return <Separator orientation="vertical" className="h-6" />
}

export function FloatingToolbarSwitch({
  icon,
  checked,
  onCheckedChange,
  thumbComponent,
  size = 'sm',
  variant,
  ...props
}: React.ComponentPropsWithoutRef<typeof Switch> & {
  icon?: React.ReactNode
  thumbComponent?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        thumbComponent={thumbComponent}
        size={size}
        variant={variant}
        {...props}
      />
    </div>
  )
}

export function FloatingToolbar({
  className,
  children,
  ...props
}: PropsWithChildren<FloatingToolbarProps>) {
  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl border bg-sidebar p-1 shadow-lg backdrop-blur-xs',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
