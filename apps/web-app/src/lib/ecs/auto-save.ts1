import type { World } from "bitecs";

import type { AutoSaveConfig, MapMetadata } from "./types";
import { saveMap } from "./map-serialization";

const DEFAULT_AUTO_SAVE_CONFIG: AutoSaveConfig = {
  enabled: true,
  interval: 5 * 60 * 1000, // 5 minutes
  maxAutoSaves: 5,
};

class AutoSaveManager {
  private config: AutoSaveConfig;
  private currentMap: MapMetadata | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private world: World | null = null;

  constructor(config: Partial<AutoSaveConfig> = {}) {
    this.config = { ...DEFAULT_AUTO_SAVE_CONFIG, ...config };
  }

  setWorld(world: World): void {
    this.world = world;
  }

  setCurrentMap(metadata: MapMetadata): void {
    this.currentMap = metadata;
    // Reset auto-save sequence when loading a new map
    if (!metadata.autoSave) {
      metadata.autoSave = {
        lastAutoSave: new Date().toISOString(),
        sequence: 0,
      };
    }
  }

  start(): void {
    if (!this.config.enabled) return;

    this.stop(); // Clear any existing interval

    this.intervalId = setInterval(() => {
      void this.performAutoSave();
    }, this.config.interval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  updateConfig(config: Partial<AutoSaveConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart auto-save with new config if enabled
    if (this.config.enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  private async performAutoSave(): Promise<void> {
    if (!this.world || !this.currentMap) {
      return;
    }

    try {
      // Increment auto-save sequence
      const sequence = (this.currentMap.autoSave?.sequence ?? 0) + 1;

      // Create auto-save metadata
      const autoSaveMetadata: MapMetadata = {
        ...this.currentMap,
        autoSave: {
          lastAutoSave: new Date().toISOString(),
          sequence,
        },
        name: `${this.currentMap.name}-auto-${sequence}`,
      };

      await saveMap(this.world, autoSaveMetadata);

      // Update current map's auto-save info
      this.currentMap.autoSave = autoSaveMetadata.autoSave;

      // Notify on successful auto-save
      this.config.onAutoSave?.(autoSaveMetadata);
    } catch (error) {
      // Handle auto-save errors
      this.config.onAutoSaveError?.(error as Error);
      console.error("Auto-save failed:", error);
    }
  }

  /**
   * Trigger an immediate auto-save
   */
  async saveNow(): Promise<void> {
    await this.performAutoSave();
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getCurrentInterval(): number {
    return this.config.interval;
  }

  getMaxAutoSaves(): number {
    return this.config.maxAutoSaves;
  }
}

// Export a singleton instance
export const autoSaveManager = new AutoSaveManager();

// Export the class for testing and custom instances
export { AutoSaveManager };
