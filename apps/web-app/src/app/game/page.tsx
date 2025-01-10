import { SidebarInset, SidebarProvider } from "@acme/ui/sidebar";

import { DebugSidebarLeft } from "~/components/debug-sidebar-left/sidebar";
import { DebugSidebarRight } from "~/components/debug-sidebar-right/sidebar";
import { GameCanvas } from "~/components/game/game-canvas";
import { GameCommandMenu } from "~/components/game/game-command-menu";
import { GameContextMenu } from "~/components/game/game-context-menu";
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
          <GameContextMenu>
            <GameCanvas />
          </GameContextMenu>
          <NPCInteractionManager />
          <GameToolbar />
          <GameCommandMenu />
        </main>
      </SidebarInset>
      <SidebarProvider defaultOpen={false}>
        <DebugSidebarRight />
      </SidebarProvider>
    </SidebarProvider>
  );
}
