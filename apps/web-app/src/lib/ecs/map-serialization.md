# Map Serialization System

The map serialization system provides functionality to save, load, and manage game maps, including versioning, backups, and migration support.

## Overview

The system consists of several key components:

- Map file format and metadata
- Serialization/deserialization of map data
- Version migration system
- Backup management
- Editor state persistence

## Map File Format

Maps are stored in JSON files with the following structure:

```typescript
interface MapFile {
  metadata: MapMetadata;
  data: string; // Base64 encoded ArrayBuffer of serialized entities
}
```

### Metadata

The metadata includes:

- Basic information (name, description, tags)
- Version information (version, schemaVersion)
- Timestamps (createdAt, updatedAt)
- Map properties (dimensions, spawnPoints)
- Editor state (camera, grid settings, layer visibility)
- Template information (isTemplate, parentMapId)

## Version Migration System

The system uses a schema versioning system to handle changes to the map format over time.

### Schema Versions

Each map file includes a `schemaVersion` field that indicates the format version of the map data. The current schema version is defined by `CURRENT_SCHEMA_VERSION`.

### Migration Functions

Migration functions are defined for each version upgrade:

```typescript
const migrationFunctions: Record<number, (mapFile: MapFile) => MapFile> = {
  1: (mapFile) => mapFile, // Current version
  2: (mapFile) => {
    // Example migration from v1 to v2
    return {
      ...mapFile,
      metadata: {
        ...mapFile.metadata,
        schemaVersion: 2,
        // Add/modify new fields
      },
    };
  },
};
```

### Migration Process

When loading a map:

1. The system checks the map's schema version
2. If older than current:
   - Applies migration functions in sequence
   - Each function upgrades the map one version
3. If newer than current:
   - Throws error (can't load future versions)
4. If same as current:
   - No migration needed

Example migration path:

```
Map v1 -> migrate to v2 -> migrate to v3 -> Current version
```

### Adding New Migrations

To add support for a new map format version:

1. Increment `CURRENT_SCHEMA_VERSION`
2. Add migration function to `migrationFunctions`
3. Update types and validation schemas
4. Add tests for the migration

Example:

```typescript
// Adding support for v2
const CURRENT_SCHEMA_VERSION = 2;

const migrationFunctions = {
  1: (mapFile) => {
    // Migrate from v1 to v2
    return {
      ...mapFile,
      metadata: {
        ...mapFile.metadata,
        schemaVersion: 2,
        newField: "default value",
      },
    };
  },
};
```

## Backup System

The system automatically creates backups:

- Before saving maps
- Before updating maps
- Before restoring backups

Backup features:

- Keeps last 5 backups per map
- Stores backups in separate directory
- Maintains backup history
- Allows restoration to any backup point

## Usage Examples

### Saving a Map

```typescript
await saveMap(world, {
  name: "test-map",
  description: "Test map",
  dimensions: { width: 1000, height: 1000 },
});
```

### Loading a Map

```typescript
await loadMap(world, "maps/test-map-v1.map.json");
```

### Managing Backups

```typescript
// List backups
const backups = await listMapBackups("test-map");

// Restore backup
await restoreMapBackup(world, "test-map", backups[0].backupDate);
```

## Best Practices

1. **Version Management**

   - Always increment schema version for breaking changes
   - Provide migration path from previous version
   - Test migrations thoroughly

2. **Backup Management**

   - Don't delete backups automatically
   - Keep reasonable number of backups
   - Validate backups before restoring

3. **Error Handling**
   - Validate map files before loading
   - Handle migration errors gracefully
   - Maintain data integrity during updates
