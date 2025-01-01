"use client";

import type { World } from "bitecs";
import { useEffect, useState } from "react";
import { query } from "bitecs";

import { NPCInteraction } from "~/lib/ecs/components";
import { NPCDialog } from "./npc-dialog";

interface NPCInteractionManagerProps {
  world: World;
}

export function NPCInteractionManager({ world }: NPCInteractionManagerProps) {
  const [activeInteraction, setActiveInteraction] = useState<{
    message: string;
    entityId: number;
  } | null>(null);

  useEffect(() => {
    // Check for active interactions each frame
    function checkInteractions() {
      const interacting = query(world, [NPCInteraction]);

      // Find the first active interaction
      for (const eid of interacting) {
        const message = NPCInteraction.message[eid];
        if (typeof message === "string" && message.length > 0) {
          setActiveInteraction({ entityId: eid, message });
          return;
        }
      }

      // No active interactions found
      setActiveInteraction(null);
    }

    const interval = setInterval(checkInteractions, 100);
    return () => clearInterval(interval);
  }, [world]);

  const handleClose = () => {
    if (activeInteraction) {
      // Set message to empty string instead of deleting to maintain type safety
      NPCInteraction.message[activeInteraction.entityId] = "";
      setActiveInteraction(null);
    }
  };

  return (
    <NPCDialog
      isOpen={activeInteraction !== null}
      onClose={handleClose}
      message={activeInteraction?.message ?? ""}
    />
  );
}