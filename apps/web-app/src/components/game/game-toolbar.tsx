"use client";

import {
  FloatingToolbar,
  FloatingToolbarButton,
  FloatingToolbarSeparator,
} from "@acme/ui/floating-toolbar";
import { Icons } from "@acme/ui/icons";

import { useDebugStore } from "~/providers/debug-provider";

export function GameToolbar() {
  const debugStore = useDebugStore((state) => state);

  return (
    <FloatingToolbar>
      <FloatingToolbarButton icon={<Icons.ArrowRight size="sm" />} />
      <FloatingToolbarSeparator />
      <FloatingToolbarButton icon={<Icons.Flame size="sm" />} />
      <FloatingToolbarButton icon={<Icons.Text size="sm" />} />
      <FloatingToolbarButton icon={<Icons.Circle size="sm" />} />
      <FloatingToolbarButton icon={<Icons.UsersRound size="sm" />} />
      <FloatingToolbarSeparator />
      <FloatingToolbarButton
        icon={<Icons.Command size="sm" />}
        variant={debugStore.selectedEntityId === null ? undefined : "secondary"}
      />
    </FloatingToolbar>
  );
}
