"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import { Icons } from "@acme/ui/icons";

import { useGame } from "../providers/game-provider";

export function MapOperations() {
  const currentMap = useGame((state) => state.currentMap);
  const isDirty = useGame((state) => state.isDirty);
  const isLoading = useGame((state) => state.isLoading);
  const isSaving = useGame((state) => state.isSaving);
  const saveCurrentMap = useGame((state) => state.saveCurrentMap);

  const handleSave = useCallback(async () => {
    try {
      await saveCurrentMap();
      toast.success("Map saved successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save map",
      );
    }
  }, [saveCurrentMap]);

  return (
    <div className="flex items-center gap-2">
      <Button
        disabled={!currentMap || (!isDirty && !isLoading)}
        onClick={handleSave}
        size="sm"
        variant="outline"
      >
        {isSaving ? (
          <Icons.Spinner size="sm" variant="muted" />
        ) : (
          <Icons.Download size="sm" />
        )}
        Save
      </Button>
      {isDirty && (
        <div className="text-sm text-muted-foreground">Unsaved changes</div>
      )}
    </div>
  );
}
