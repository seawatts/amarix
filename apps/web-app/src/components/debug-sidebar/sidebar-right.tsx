"use client";

import { ViewVerticalIcon } from "@radix-ui/react-icons";

import { Button } from "@acme/ui/button";
import { Sidebar, SidebarContent, SidebarHeader } from "@acme/ui/sidebar";

import { useDebugStore } from "~/providers/debug-provider";
import { EntityDetailsSidebar } from "./entity-details-sidebar";

export function DebugSidebarRight() {
  const selectedEntityId = useDebugStore((state) => state.selectedEntityId);
  const setSelectedEntityId = useDebugStore(
    (state) => state.setSelectedEntityId,
  );

  // if (!selectedEntityId) return null;
  return (
    <Sidebar
      collapsible="offcanvas"
      // state={selectedEntityId ? "extended" : "collapsed"}
      // className="sticky top-0 hidden h-svh border-l lg:flex"
      side="right"
    >
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
        <EntityDetailsSidebar entityId={selectedEntityId} />
      </SidebarContent>
    </Sidebar>
  );
}
