'use client'

import {
  FloatingToolbar,
  FloatingToolbarButton,
  FloatingToolbarSeparator,
} from '@acme/ui/floating-toolbar'
import { Icons } from '@acme/ui/icons'

import { useDebugStore } from '~/providers/debug-provider'

export function GameToolbar() {
  const selectedEntityId = useDebugStore((state) => state.selectedEntityId)
  // const setIsDebugging = useDebugStore((state) => state.setIsDebugging);
  // const isDebugging = useDebugStore((state) => state.isDebugging);

  return (
    <FloatingToolbar>
      <FloatingToolbarButton icon={<Icons.ArrowRight size="sm" />} />
      <FloatingToolbarSeparator />
      <FloatingToolbarButton icon={<Icons.Flame size="sm" />} />
      <FloatingToolbarButton icon={<Icons.Text size="sm" />} />
      <FloatingToolbarButton icon={<Icons.Circle size="sm" />} />
      <FloatingToolbarButton icon={<Icons.UsersRound size="sm" />} />
      {/* <FloatingToolbarSwitch
        checked={isDebugging}
        onCheckedChange={setIsDebugging}
        size="lg"
        variant="success"
        // thumbComponent={
        //   <div className={thumbVariants({ size: "lg" })}>
        //     <Icons.Check size="sm" className="m-0.5" />
        //   </div>
        // }
      /> */}
      <FloatingToolbarSeparator />
      <FloatingToolbarButton
        icon={<Icons.Command size="sm" />}
        variant={selectedEntityId === null ? undefined : 'secondary'}
      />
    </FloatingToolbar>
  )
}
