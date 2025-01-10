"use client";

import { useEffect } from "react";
import { ViewVerticalIcon } from "@radix-ui/react-icons";

import { Button } from "@acme/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from "@acme/ui/sidebar";

import { useHotkeys } from "~/hooks/use-hotkeys";
import { useDebugStore } from "~/providers/debug-provider";
import { EntityDetailsSidebar } from "./entity-details-sidebar";

export function DebugSidebarRight() {
  const sidebar = useSidebar();
  const selectedEntityId = useDebugStore((state) => state.selectedEntityId);
  const setSelectedEntityId = useDebugStore(
    (state) => state.setSelectedEntityId,
  );

  useEffect(() => {
    sidebar.setOpen(!!selectedEntityId);
  }, [selectedEntityId, sidebar]);

  useHotkeys({
    Escape: () => {
      setSelectedEntityId(null);
    },
  });

  return (
    <Sidebar collapsible="offcanvas" side="right">
      <SidebarHeader className="flex-row items-center justify-between gap-2">
        <Button
          data-sidebar="trigger"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedEntityId(null);
          }}
        >
          <ViewVerticalIcon />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </SidebarHeader>
      <SidebarContent>
        {selectedEntityId && (
          <EntityDetailsSidebar entityId={selectedEntityId} />
        )}
      </SidebarContent>
    </Sidebar>
  );
}
