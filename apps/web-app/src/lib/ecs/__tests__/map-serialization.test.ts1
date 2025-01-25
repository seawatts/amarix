import * as fs from "node:fs";
import type { Dirent } from "node:fs";
import { addComponent, addEntity, createWorld } from "bitecs";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { MapFile, MapMetadata } from "./types";
import { Transform } from "./components";
import {
  deleteMap,
  listMapBackups,
  listMaps,
  loadMap,
  restoreMapBackup,
  saveMap,
  updateMap,
} from "./map-serialization";

vi.mock("node:fs", () => ({
  promises: {
    access: vi.fn(),
    mkdir: vi.fn(),
    readFile: vi.fn(),
    readdir: vi.fn(),
    unlink: vi.fn(),
    writeFile: vi.fn(),
  },
}));

describe("Map Serialization", () => {
  const mockedFs = vi.mocked(fs);
  let world: ReturnType<typeof createWorld>;
  let testEntity: number;

  beforeEach(() => {
    world = createWorld();
    testEntity = addEntity(world);
    addComponent(world, testEntity, Transform);
    Transform.x[testEntity] = 100;
    Transform.y[testEntity] = 200;

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("saveMap", () => {
    test("should save map with valid metadata", async () => {
      const metadata: Omit<
        MapMetadata,
        "version" | "updatedAt" | "createdAt" | "schemaVersion"
      > = {
        description: "Test map",
        name: "test-map",
      };

      await saveMap(world, metadata);

      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
      const writeCall = vi.mocked(mockedFs.promises.writeFile).mock.calls[0];
      if (!writeCall) throw new Error("Write call not found");

      const savedData = JSON.parse(writeCall[1] as string) as MapFile;
      expect(savedData.metadata).toMatchObject({
        description: "Test map",
        name: "test-map",
        schemaVersion: 1,
      });
      expect(savedData.data).toBeDefined();
    });

    test("should throw error for invalid map name", async () => {
      const metadata = {
        description: "Test map",
        name: "Invalid Name!",
      };

      await expect(saveMap(world, metadata)).rejects.toThrow();
    });
  });

  describe("loadMap", () => {
    test("should load and migrate map file", async () => {
      const mockMapFile = {
        data: "test-data",
        metadata: {
          createdAt: new Date().toISOString(),
          name: "test-map",
          schemaVersion: 1,
          updatedAt: new Date().toISOString(),
          version: "v1",
        },
      };

      vi.mocked(mockedFs.promises.readFile).mockResolvedValue(
        JSON.stringify(mockMapFile),
      );

      await loadMap(world, "test-map.json");
      expect(mockedFs.promises.readFile).toHaveBeenCalled();
    });

    test("should throw error for invalid map file", async () => {
      vi.mocked(mockedFs.promises.readFile).mockResolvedValue("invalid json");

      await expect(loadMap(world, "invalid.json")).rejects.toThrow();
    });
  });

  describe("listMaps", () => {
    test("should list all valid maps", async () => {
      const mockMaps = [
        {
          data: "",
          metadata: {
            createdAt: new Date().toISOString(),
            name: "map1",
            schemaVersion: 1,
            updatedAt: new Date().toISOString(),
            version: "v1",
          },
        },
        {
          data: "",
          metadata: {
            createdAt: new Date().toISOString(),
            name: "map2",
            schemaVersion: 1,
            updatedAt: new Date().toISOString(),
            version: "v1",
          },
        },
      ];

      vi.mocked(mockedFs.promises.readdir).mockResolvedValue([
        { name: "map1.map.json" },
        { name: "map2.map.json" },
      ] as Dirent[]);

      vi.mocked(mockedFs.promises.readFile).mockImplementation((path) => {
        if (typeof path !== "string") throw new Error("Invalid path");
        const mapName = path.includes("map1") ? mockMaps[0] : mockMaps[1];
        return Promise.resolve(JSON.stringify(mapName));
      });

      const maps = await listMaps();
      expect(maps).toHaveLength(2);
      expect(maps[0]?.name).toBe("map1");
      expect(maps[1]?.name).toBe("map2");
    });
  });

  describe("backups", () => {
    test("should create and list backups", async () => {
      const mockBackups = [
        {
          backupDate: new Date().toISOString(),
          mapFile: {
            data: "",
            metadata: {
              createdAt: new Date().toISOString(),
              name: "test-map",
              schemaVersion: 1,
              updatedAt: new Date().toISOString(),
              version: "v1",
            },
          },
        },
      ];

      vi.mocked(mockedFs.promises.readdir).mockResolvedValue([
        { name: "backup1.backup.json" },
      ] as Dirent[]);

      vi.mocked(mockedFs.promises.readFile).mockResolvedValue(
        JSON.stringify(mockBackups[0]),
      );

      const backups = await listMapBackups("test-map");
      expect(backups).toHaveLength(1);
      expect(backups[0]?.mapFile.metadata?.name).toBe("test-map");
    });

    test("should restore backup", async () => {
      const mockBackup = {
        backupDate: new Date().toISOString(),
        mapFile: {
          data: "test-data",
          metadata: {
            createdAt: new Date().toISOString(),
            name: "test-map",
            schemaVersion: 1,
            updatedAt: new Date().toISOString(),
            version: "v1",
          },
        },
      };

      vi.mocked(mockedFs.promises.readdir).mockResolvedValue([
        { name: "backup1.backup.json" },
      ] as Dirent[]);

      vi.mocked(mockedFs.promises.readFile).mockResolvedValue(
        JSON.stringify(mockBackup),
      );

      await restoreMapBackup(world, "test-map", mockBackup.backupDate);
      expect(mockedFs.promises.readFile).toHaveBeenCalled();
    });
  });

  describe("updateMap", () => {
    test("should update existing map", async () => {
      const mockMap = {
        data: "",
        metadata: {
          createdAt: new Date().toISOString(),
          name: "test-map",
          schemaVersion: 1,
          updatedAt: new Date().toISOString(),
          version: "v1",
        },
      };

      vi.mocked(mockedFs.promises.readdir).mockResolvedValue([
        { name: "test-map.map.json" },
      ] as Dirent[]);

      vi.mocked(mockedFs.promises.readFile).mockResolvedValue(
        JSON.stringify(mockMap),
      );

      const updates = {
        description: "Updated description",
      };

      await updateMap(world, "test-map", updates);
      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });

    test("should throw error for non-existent map", async () => {
      vi.mocked(mockedFs.promises.readdir).mockResolvedValue([]);

      await expect(
        updateMap(world, "non-existent", { description: "test" }),
      ).rejects.toThrow();
    });
  });

  describe("deleteMap", () => {
    test("should delete existing map", async () => {
      const mockMap = {
        data: "",
        metadata: {
          createdAt: new Date().toISOString(),
          name: "test-map",
          schemaVersion: 1,
          updatedAt: new Date().toISOString(),
          version: "v1",
        },
      };

      vi.mocked(mockedFs.promises.readdir).mockResolvedValue([
        { name: "test-map.map.json" },
      ] as Dirent[]);

      vi.mocked(mockedFs.promises.readFile).mockResolvedValue(
        JSON.stringify(mockMap),
      );

      await deleteMap("test-map");
      expect(mockedFs.promises.unlink).toHaveBeenCalled();
    });

    test("should throw error for non-existent map", async () => {
      vi.mocked(mockedFs.promises.readdir).mockResolvedValue([]);

      await expect(deleteMap("non-existent")).rejects.toThrow();
    });
  });
});
