"use server";

import { promises as fs } from "node:fs";
import path from "node:path";

import type { MapBackup, MapFile, MapMetadata } from "./types";
import { mapFileSchema } from "./types";

const MAPS_DIRECTORY = path.join(process.cwd(), "src/maps");
const BACKUPS_DIRECTORY = path.join(MAPS_DIRECTORY, "backups");
const MAX_BACKUPS = 5;
const MAP_VERSION = "v1";
const CURRENT_SCHEMA_VERSION = 1;

// Version migration functions
const migrationFunctions: Record<number, (mapFile: MapFile) => MapFile> = {
  1: (mapFile) => mapFile, // Current version, no migration needed
  // Add future migration functions here
  // 2: (mapFile) => { ... },
  // 3: (mapFile) => { ... },
};

function migrateMapFile(mapFile: MapFile): MapFile {
  const currentVersion = mapFile.metadata.schemaVersion;

  if (currentVersion === CURRENT_SCHEMA_VERSION) {
    return mapFile;
  }

  if (currentVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Map schema version ${currentVersion} is newer than the current version ${CURRENT_SCHEMA_VERSION}`,
    );
  }

  let migratedFile = mapFile;
  for (
    let version = currentVersion + 1;
    version <= CURRENT_SCHEMA_VERSION;
    version++
  ) {
    const migrationFn = migrationFunctions[version];
    if (!migrationFn) {
      throw new Error(`No migration function found for version ${version}`);
    }
    migratedFile = migrationFn(migratedFile);
  }

  return migratedFile;
}

export async function writeMapFile(
  filename: string,
  data: string,
  metadata: MapMetadata,
): Promise<void> {
  await ensureMapsDirectory();
  const filePath = path.join(MAPS_DIRECTORY, filename);
  const mapFile: MapFile = { data, metadata };

  await fs.writeFile(filePath, JSON.stringify(mapFile, null, 2));

  // Create a backup
  const backupDirectory = path.join(BACKUPS_DIRECTORY, metadata.name);
  await fs.mkdir(backupDirectory, { recursive: true });
  const backup: MapBackup = {
    backupDate: new Date().toISOString(),
    mapFile,
  };

  const backupPath = path.join(
    backupDirectory,
    `${metadata.name}-${metadata.version}-${backup.backupDate.replaceAll(/[:.]/g, "")}.backup.json`,
  );
  await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
  // Clean up old backups
  const backups = await fs.readdir(backupDirectory);
  if (backups.length > MAX_BACKUPS) {
    const oldestBackups = backups.sort().slice(0, backups.length - MAX_BACKUPS);
    await Promise.all(
      oldestBackups.map((backup) =>
        fs.unlink(path.join(backupDirectory, backup)),
      ),
    );
  }
}

export async function readMapFile(filePath: string): Promise<MapFile> {
  const fullPath = path.join(MAPS_DIRECTORY, filePath);

  try {
    await fs.access(fullPath);
  } catch {
    throw new Error(`Map file not found: ${filePath}`);
  }

  const content = await fs.readFile(fullPath, "utf8");
  const parsedFile = JSON.parse(content) as unknown;
  const mapFile = mapFileSchema.parse(parsedFile);
  return migrateMapFile(mapFile);
}

export async function listMapFiles(): Promise<string[]> {
  const files = await fs.readdir(MAPS_DIRECTORY);
  return files.filter((file) => file.endsWith(".map.json"));
}

export async function listMapBackups(mapName: string): Promise<MapBackup[]> {
  const backupDirectory = path.join(BACKUPS_DIRECTORY, mapName);

  try {
    const files = await fs.readdir(backupDirectory);
    const backups: MapBackup[] = [];

    for (const file of files) {
      if (!file.endsWith(".backup.json")) continue;

      const content = await fs.readFile(
        path.join(backupDirectory, file),
        "utf8",
      );
      const backup = JSON.parse(content) as MapBackup;
      backups.push(backup);
    }

    return backups.sort(
      (a, b) =>
        new Date(b.backupDate).getTime() - new Date(a.backupDate).getTime(),
    );
  } catch {
    return [];
  }
}

export async function deleteMapFile(filePath: string): Promise<void> {
  const fullPath = path.join(MAPS_DIRECTORY, filePath);
  await fs.unlink(fullPath);
}

export async function ensureMapsDirectory(): Promise<void> {
  try {
    await fs.access(MAPS_DIRECTORY);
    await fs.access(BACKUPS_DIRECTORY);
  } catch {
    await fs.mkdir(MAPS_DIRECTORY, { recursive: true });
    await fs.mkdir(BACKUPS_DIRECTORY, { recursive: true });
  }
}
