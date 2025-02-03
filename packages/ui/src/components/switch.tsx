'use client'

import * as SwitchPrimitives from '@radix-ui/react-switch'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@acme/ui/lib/utils'

export const switchVariants = cva(
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-2xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-5 w-9',
        lg: 'h-6 w-11',
        sm: 'h-4 w-7',
      },
      variant: {
        default: '',
        destructive: 'data-[state=checked]:bg-destructive',
        success: 'data-[state=checked]:bg-success',
      },
    },
  },
)

export const thumbVariants = cva(
  'block rounded-full bg-background shadow-lg ring-0 transition-transform',
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default:
          'h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
        lg: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        sm: 'h-3 w-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0',
      },
    },
  },
)

interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants> {
  thumbComponent?: React.ReactNode
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, thumbComponent, size, variant, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(switchVariants({ size, variant }), className)}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      asChild={Boolean(thumbComponent)}
      className={cn(
        thumbComponent
          ? 'block'
          : cn(thumbVariants({ size }), 'pointer-events-none'),
      )}
    >
      {thumbComponent ?? <span />}
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
))

Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch, type SwitchProps }
