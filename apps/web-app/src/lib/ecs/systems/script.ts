import { query } from "bitecs";

import type { World } from "../types";
import { Script, Transform } from "../components";

// Script registry to store script functions
type ScriptFunction = (eid: number, world: World, deltaTime: number) => void;
const scriptRegistry: ScriptFunction[] = [];

// Register a new script function and return its ID
export function registerScript(fn: ScriptFunction): number {
  scriptRegistry.push(fn);
  return scriptRegistry.length - 1;
}

// Example script: oscillate entity position
export function createOscillateScript(
  amplitude: number,
  frequency: number,
): ScriptFunction {
  return (eid: number, _world: World, deltaTime: number) => {
    const timer = Script.timer[eid] ?? 0;
    const newTimer = timer + deltaTime;
    Script.timer[eid] = newTimer;

    // Calculate new position based on sine wave
    const offset = Math.sin(2 * Math.PI * frequency * newTimer) * amplitude;

    // Update position
    const baseY = Transform.y[eid] ?? 0;
    Transform.y[eid] = baseY + offset;
  };
}

// Create the scripting system
export function createScriptSystem() {
  return function scriptSystem(world: World) {
    const entities = query(world, [Script]);
    const deltaTime = 1 / 60; // Fixed time step

    for (const eid of entities) {
      // Skip inactive scripts
      if (Script.isActive[eid] !== 1) continue;

      // Get script function from registry
      const scriptId = Math.floor(Script.scriptId[eid] ?? 0);

      // Validate script ID
      if (scriptId >= 0 && scriptId < scriptRegistry.length) {
        const scriptFn = scriptRegistry[scriptId];
        if (scriptFn) {
          // Execute the script
          scriptFn(eid, world, deltaTime);
        }
      }
    }
  };
}

// Clear script registry (for testing)
export function clearScriptRegistry() {
  scriptRegistry.length = 0;
}
