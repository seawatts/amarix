import type { World } from "bitecs";
import { query } from "bitecs";

import { Position, Script } from "../components";

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
  return (eid: number, world: World, deltaTime: number) => {
    const timer = Script.timer[eid] ?? 0;
    const newTimer = timer + deltaTime;
    Script.timer[eid] = newTimer;

    // Calculate new position based on sine wave
    const offset = Math.sin(newTimer * frequency) * amplitude;

    // Store the offset in the script state
    Script.state[eid] = offset;

    // Update position if entity has Position component
    const entities = query(world, [Position]);
    if (entities.includes(eid)) {
      const baseY = Position.y[eid] ?? 0;
      Position.y[eid] = baseY + offset;
    }
  };
}

// Create the scripting system
export function createScriptSystem() {
  return function scriptSystem(world: World) {
    const entities = query(world, [Script]);
    const deltaTime = 1 / 60; // Fixed time step

    for (const eid of entities) {
      // Skip inactive scripts
      if (!(Script.isActive[eid] ?? 0)) continue;

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

    return world;
  };
}
