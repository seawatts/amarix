import { createWorld } from "bitecs";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { MapMetadata } from "./types";
import { AutoSaveManager } from "./auto-save";

// Mock saveMap function
const mockSaveMap = vi.fn();

// Mock map-serialization module
vi.mock("./map-serialization", () => ({
  saveMap: mockSaveMap,
}));

describe("AutoSaveManager", () => {
  let autoSaveManager: AutoSaveManager;
  let world: ReturnType<typeof createWorld>;
  const mockMap: MapMetadata = {
    createdAt: new Date().toISOString(),
    name: "test-map",
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    version: "v1",
  };

  beforeEach(() => {
    vi.useFakeTimers();
    world = createWorld();
    autoSaveManager = new AutoSaveManager({
      interval: 1000, // 1 second for testing
      maxAutoSaves: 3,
    });
    autoSaveManager.setWorld(world);
    mockSaveMap.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  test("should initialize with default config", () => {
    const manager = new AutoSaveManager();
    expect(manager.isEnabled()).toBe(true);
    expect(manager.getCurrentInterval()).toBe(5 * 60 * 1000);
    expect(manager.getMaxAutoSaves()).toBe(5);
  });

  test("should update config", () => {
    autoSaveManager.updateConfig({ interval: 2000 });
    expect(autoSaveManager.getCurrentInterval()).toBe(2000);
  });

  test("should start auto-save timer", () => {
    autoSaveManager.setCurrentMap(mockMap);
    autoSaveManager.start();

    // Fast-forward time
    vi.advanceTimersByTime(1000);

    expect(mockSaveMap).toHaveBeenCalled();
  });

  test("should stop auto-save timer", () => {
    autoSaveManager.setCurrentMap(mockMap);
    autoSaveManager.start();
    autoSaveManager.stop();

    // Fast-forward time
    vi.advanceTimersByTime(1000);

    expect(mockSaveMap).not.toHaveBeenCalled();
  });

  test("should increment auto-save sequence", async () => {
    autoSaveManager.setCurrentMap(mockMap);

    // Trigger first auto-save
    await autoSaveManager.saveNow();
    expect(mockMap.autoSave?.sequence).toBe(1);

    // Trigger second auto-save
    await autoSaveManager.saveNow();
    expect(mockMap.autoSave?.sequence).toBe(2);

    expect(mockSaveMap).toHaveBeenCalledTimes(2);
  });

  test("should call onAutoSave callback", async () => {
    const onAutoSave = vi.fn();
    autoSaveManager.updateConfig({ onAutoSave });
    autoSaveManager.setCurrentMap(mockMap);

    await autoSaveManager.saveNow();

    type ExpectedMetadata = Pick<MapMetadata, "name" | "autoSave">;
    expect(onAutoSave).toHaveBeenCalledWith(
      expect.objectContaining<ExpectedMetadata>({
        autoSave: {
          lastAutoSave: expect.any(String),
          sequence: 1,
        },
        name: expect.stringContaining("test-map-auto-1"),
      }),
    );
  });

  test("should call onAutoSaveError callback on error", async () => {
    const error = new Error("Save failed");
    mockSaveMap.mockRejectedValueOnce(error);

    const onAutoSaveError = vi.fn();
    autoSaveManager.updateConfig({ onAutoSaveError });
    autoSaveManager.setCurrentMap(mockMap);

    await autoSaveManager.saveNow();

    expect(onAutoSaveError).toHaveBeenCalledWith(error);
  });

  test("should not auto-save without world", async () => {
    const manager = new AutoSaveManager();
    manager.setCurrentMap(mockMap);

    await manager.saveNow();

    expect(mockSaveMap).not.toHaveBeenCalled();
  });

  test("should not auto-save without current map", async () => {
    const manager = new AutoSaveManager();
    manager.setWorld(world);

    await manager.saveNow();

    expect(mockSaveMap).not.toHaveBeenCalled();
  });

  test("should handle disabled auto-save", () => {
    const manager = new AutoSaveManager({ enabled: false });
    manager.setWorld(world);
    manager.setCurrentMap(mockMap);
    manager.start();

    expect(manager.isEnabled()).toBe(false);
  });
});
