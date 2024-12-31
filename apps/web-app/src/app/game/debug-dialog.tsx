"use client";

import { useEffect, useState } from "react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Icons } from "@acme/ui/icons";
import { Text } from "@acme/ui/typography";

interface DebugMetrics {
  fps: number;
  entityCount: number;
  componentCounts: {
    position: number;
    movement: number;
    player: number;
  };
  memoryUsage: number;
  lastFrameTime: number;
}

interface DebugDialogProps {
  getMetrics: () => DebugMetrics;
}

export function DebugDialog({ getMetrics }: DebugDialogProps) {
  const [metrics, setMetrics] = useState<DebugMetrics>({
    componentCounts: {
      movement: 0,
      player: 0,
      position: 0,
    },
    entityCount: 0,
    fps: 0,
    lastFrameTime: 0,
    memoryUsage: 0,
  });

  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const updateMetrics = () => {
      const currentTime = performance.now();
      frameCount++;

      // Update FPS every second
      if (currentTime - lastTime >= 1000) {
        const newMetrics = getMetrics();
        newMetrics.fps = frameCount;
        setMetrics(newMetrics);

        frameCount = 0;
        lastTime = currentTime;
      }

      frameId = requestAnimationFrame(updateMetrics);
    };

    frameId = requestAnimationFrame(updateMetrics);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [getMetrics]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-50"
        >
          <Icons.Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Debug Information</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Text className="font-semibold">Performance</Text>
            <div className="grid grid-cols-2 gap-2 rounded-lg border p-4">
              <Text>FPS</Text>
              <Text>{metrics.fps}</Text>
              <Text>Frame Time</Text>
              <Text>{metrics.lastFrameTime.toFixed(2)}ms</Text>
              <Text>Memory Usage</Text>
              <Text>{(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB</Text>
            </div>
          </div>
          <div className="grid gap-2">
            <Text className="font-semibold">ECS Status</Text>
            <div className="grid grid-cols-2 gap-2 rounded-lg border p-4">
              <Text>Total Entities</Text>
              <Text>{metrics.entityCount}</Text>
              <Text>Position Components</Text>
              <Text>{metrics.componentCounts.position}</Text>
              <Text>Movement Components</Text>
              <Text>{metrics.componentCounts.movement}</Text>
              <Text>Player Components</Text>
              <Text>{metrics.componentCounts.player}</Text>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
