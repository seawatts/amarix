import { createWorld, query } from "bitecs";
import { describe, expect, it } from "vitest";

import type { WorldProps } from "../../types";
import { Camera, Debug, Named, Transform } from "../../components";
import { createCamera } from "../camera";

describe("Camera Entity", () => {
  it("should create a camera with default values", () => {
    const world = createWorld<WorldProps>();
    const cameraEid = createCamera(world);

    // Check if camera entity has all required components
    const cameras = query(world, [Camera, Transform, Named, Debug]);
    expect(cameras).toContain(cameraEid);

    // Check default values
    expect(Camera.isActive[cameraEid]).toBe(1);
    expect(Camera.isPanning[cameraEid]).toBe(0);
    expect(Camera.lastPanX[cameraEid]).toBe(0);
    expect(Camera.lastPanY[cameraEid]).toBe(0);
    expect(Camera.maxX[cameraEid]).toBe(Number.POSITIVE_INFINITY);
    expect(Camera.maxY[cameraEid]).toBe(Number.POSITIVE_INFINITY);
    expect(Camera.minX[cameraEid]).toBe(Number.NEGATIVE_INFINITY);
    expect(Camera.minY[cameraEid]).toBe(Number.NEGATIVE_INFINITY);
    expect(Camera.smoothing[cameraEid]).toBeCloseTo(0.1, 4);
    expect(Camera.target[cameraEid]).toBe(0);
    expect(Camera.zoom[cameraEid]).toBe(1);

    // Check transform values
    expect(Transform.x[cameraEid]).toBe(0);
    expect(Transform.y[cameraEid]).toBe(0);
    expect(Transform.rotation[cameraEid]).toBe(0);
    expect(Transform.scaleX[cameraEid]).toBe(1);
    expect(Transform.scaleY[cameraEid]).toBe(1);

    // Check name
    expect(Named.name[cameraEid]).toBe("Camera");
  });

  it("should create a camera with target", () => {
    const world = createWorld<WorldProps>();
    const targetEid = 42;
    const cameraEid = createCamera(world, { target: targetEid });

    expect(Camera.target[cameraEid]).toBe(targetEid);
  });
});
