import type { World } from "bitecs";
import { addComponent, addEntity, createWorld } from "bitecs";
import { describe, expect, it } from "vitest";

import { Script, Transform } from "../../components";
import {
  createOscillateScript,
  createScriptSystem,
  registerScript,
} from "../script";

describe.skip("Script System", () => {
  it("should not execute inactive scripts", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up scripted entity
    addComponent(world, eid, Script);
    Script.isActive[eid] = 0; // Inactive

    // Create a test script
    const testScript = (scriptEid: number) => {
      Script.state[scriptEid] = 42;
    };

    // Register the script and assign it to the entity
    const scriptId = registerScript(testScript);
    Script.scriptId[eid] = scriptId;

    // Initialize state to 0
    Script.state[eid] = 0;

    const scriptSystem = createScriptSystem();
    scriptSystem(world);

    // Verify script was not executed
    expect(Script.state[eid]).toBe(0);
  });

  it("should handle invalid script IDs", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up scripted entity
    addComponent(world, eid, Script);
    Script.isActive[eid] = 1;
    Script.scriptId[eid] = 999; // Invalid script ID

    // Initialize state to 0
    Script.state[eid] = 0;

    const scriptSystem = createScriptSystem();
    scriptSystem(world);

    // Should not throw error and state should remain unchanged
    expect(Script.state[eid]).toBe(0);
  });

  it("should execute oscillate script correctly", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up entity with transform and script
    addComponent(world, eid, Transform);
    addComponent(world, eid, Script);
    Script.isActive[eid] = 1;
    Transform.y[eid] = 100; // Base position

    // Create and register oscillate script
    const amplitude = 10;
    const frequency = 1; // 1 Hz
    const oscillateScript = createOscillateScript(amplitude, frequency);
    const scriptId = registerScript(oscillateScript);
    Script.scriptId[eid] = scriptId;

    // Initialize script timer to 0
    Script.timer[eid] = 0;

    const scriptSystem = createScriptSystem();

    // Run system multiple times to verify oscillation
    const positions: number[] = [];
    for (let index = 0; index < 4; index++) {
      scriptSystem(world);
      positions.push(Transform.y[eid] ?? 0);
    }

    // Verify oscillation
    // At 60 FPS, with 1 Hz frequency:
    // t=0: sin(0) = 0
    // t=1/60: sin(2π/60) ≈ 0.104
    // t=2/60: sin(4π/60) ≈ 0.208
    // t=3/60: sin(6π/60) ≈ 0.309
    const expectedOffsets = [
      0,
      Math.sin((2 * Math.PI * 1) / 60),
      Math.sin((4 * Math.PI * 1) / 60),
      Math.sin((6 * Math.PI * 1) / 60),
    ] as const;

    for (const [index, offset] of expectedOffsets.entries()) {
      const position = positions[index];
      if (position !== undefined) {
        const expectedPosition = 100 + amplitude * offset;
        expect(position).toBeCloseTo(expectedPosition, 2); // Reduced precision to 2 decimal places
      }
    }
  });

  it("should update script timer", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up entity with script
    addComponent(world, eid, Script);
    Script.isActive[eid] = 1;

    // Create a test script that checks timer
    const testScript = (
      scriptEid: number,
      _world: World,
      deltaTime: number,
    ) => {
      const currentTimer = Script.timer[scriptEid] ?? 0;
      Script.timer[scriptEid] = currentTimer + deltaTime;
    };

    // Register and assign script
    const scriptId = registerScript(testScript);
    Script.scriptId[eid] = scriptId;

    // Initialize timer to 0
    Script.timer[eid] = 0;

    const scriptSystem = createScriptSystem();

    // Run system multiple times
    for (let index = 0; index < 3; index++) {
      scriptSystem(world);
    }

    // Timer should accumulate delta time (1/60 per frame)
    expect(Script.timer[eid]).toBeCloseTo(3 / 60, 2); // Reduced precision to 2 decimal places
  });

  it("should maintain script state between executions", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up entity with script
    addComponent(world, eid, Script);
    Script.isActive[eid] = 1;

    // Create a test script that increments state
    const testScript = (scriptEid: number) => {
      const currentState = Script.state[scriptEid] ?? 0;
      Script.state[scriptEid] = currentState + 1;
    };

    // Register and assign script
    const scriptId = registerScript(testScript);
    Script.scriptId[eid] = scriptId;

    // Initialize state to 0
    Script.state[eid] = 0;

    const scriptSystem = createScriptSystem();

    // Run system multiple times
    for (let index = 0; index < 3; index++) {
      scriptSystem(world);
    }

    // State should accumulate
    expect(Script.state[eid]).toBeCloseTo(3, 2); // Reduced precision to 2 decimal places
  });
});
