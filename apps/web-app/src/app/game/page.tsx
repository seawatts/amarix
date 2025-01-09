import { SidebarInset, SidebarProvider } from "@acme/ui/sidebar";

import { DebugSidebarLeft } from "~/components/debug-sidebar/sidebar-left";
import { DebugSidebarRight } from "~/components/debug-sidebar/sidebar-right";
import { GameCanvas } from "~/components/game/game-canvas";
import { GameToolbar } from "~/components/game/game-toolbar";
import { NPCInteractionManager } from "~/components/npc-interaction-manager";

declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
    };
  }
}

export default function GamePage() {
  return (
    <SidebarProvider>
      <DebugSidebarLeft />
      <SidebarInset>
        <main className="fixed inset-0 bg-zinc-800">
          <GameCanvas />
          <NPCInteractionManager />
          <GameToolbar />
        </main>
      </SidebarInset>
      <DebugSidebarRight />
    </SidebarProvider>
  );
}
