import { addEntity, createWorld } from "bitecs";
import { describe, expect, it } from "vitest";

import type { WorldProps } from "../../types";
import { Debug } from "../../components";
import { createDebug } from "../debug";

describe("Debug Entity", () => {
  it("should create debug component with default values", () => {
    const world = createWorld<WorldProps>();
    const eid = addEntity(world);
    createDebug(eid);

    // Check default values
    expect(Debug.frameTime[eid]).toBe(0);
    expect(Debug.isPaused[eid]).toBe(0);
    expect(Debug.isSelected[eid]).toBe(0);
    expect(Debug.logLevel[eid]).toBe(3); // INFO level
    expect(Debug.physicsTime[eid]).toBe(0);
    expect(Debug.renderTime[eid]).toBe(0);
    expect(Debug.showBoundingBox[eid]).toBe(0);
    expect(Debug.showColliders[eid]).toBe(0);
    expect(Debug.showForceVectors[eid]).toBe(0);
    expect(Debug.showOrigin[eid]).toBe(0);
    expect(Debug.showTriggerZones[eid]).toBe(0);
    expect(Debug.showVelocityVector[eid]).toBe(0);
    expect(Debug.stepFrame[eid]).toBe(0);
    expect(Debug.updateTime[eid]).toBe(0);
  });

  it("should create debug component with custom values", () => {
    const world = createWorld<WorldProps>();
    const eid = addEntity(world);
    createDebug(eid, {
      logLevel: 1,
      showBoundingBox: true,
      showColliders: true,
      showForceVectors: true,
      showOrigin: true,
      showTriggerZones: true,
      showVelocityVector: true,
    });

    expect(Debug.logLevel[eid]).toBe(1);
    expect(Debug.showBoundingBox[eid]).toBe(1);
    expect(Debug.showColliders[eid]).toBe(1);
    expect(Debug.showForceVectors[eid]).toBe(1);
    expect(Debug.showOrigin[eid]).toBe(1);
    expect(Debug.showTriggerZones[eid]).toBe(1);
    expect(Debug.showVelocityVector[eid]).toBe(1);
  });

  it("should have a toString function that formats debug info", () => {
    const world = createWorld<WorldProps>();
    const eid = addEntity(world);
    createDebug(eid);

    // Set some debug values
    Debug.frameTime[eid] = 16.67; // ~60 FPS
    Debug.physicsTime[eid] = 5;
    Debug.renderTime[eid] = 8;

    const toStringFn = Debug.toString[eid] as () => string;
    const debugString = toStringFn();
    expect(debugString).toBe("FPS: 60, Physics: 5ms, Render: 8ms");
  });
});
