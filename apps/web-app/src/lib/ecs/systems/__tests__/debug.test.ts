import { addComponent, addEntity, createWorld } from 'bitecs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DebugStore } from '~/lib/stores/debug'
import {
  Debug,
  GlobalKeyboardState,
  GlobalMouseState,
  Transform,
} from '../../components'
import type { World, WorldProps } from '../../types'
import { initialGameWorldState } from '../../world'
import { createDebugSystem } from '../debug'

describe('Debug System', () => {
  let world: World
  let eid: number
  let mockDebugStore: DebugStore

  beforeEach(() => {
    world = createWorld<WorldProps>()
    eid = addEntity(world)

    // Set up debug entity
    addComponent(world, eid, Debug)
    addComponent(world, eid, Transform)

    // Reset global state
    GlobalKeyboardState.keys = 0
    GlobalMouseState.screenX = 0
    GlobalMouseState.screenY = 0
    GlobalMouseState.hoveredEntity = 0
    GlobalMouseState.clickedEntity = 0

    // Mock debug store
    mockDebugStore = {
      getSystems: vi.fn(),
      handleDebugEvent: vi.fn(),
      isDebugging: false,
      isPaused: false,
      metrics: {
        entities: [],
        performance: {
          fps: 60,
          frameTime: 16.67,
          memoryUsage: 0,
          systems: {},
        },
      },
      selectedEntityId: null,
      setIsDebugging: vi.fn(),
      setIsPaused: vi.fn(),
      setSelectedEntityId: vi.fn(),
      setSystems: vi.fn(),
      sidebarSections: {
        ecs: true,
        performance: true,
        systems: true,
        visualizations: true,
      },
      systems: {
        animation: { isEnabled: false, isPaused: false },
        battle: { isEnabled: false, isPaused: false },
        collision: { isEnabled: false, isPaused: false },
        keyboard: { isEnabled: false, isPaused: false },
        mouse: { isEnabled: false, isPaused: false },
        movement: { isEnabled: false, isPaused: false },
        npcInteraction: { isEnabled: false, isPaused: false },
        particle: { isEnabled: false, isPaused: false },
        physics: { isEnabled: false, isPaused: false },
        scene: { isEnabled: false, isPaused: false },
        script: { isEnabled: false, isPaused: false },
        sound: { isEnabled: false, isPaused: false },
        sprite: { isEnabled: false, isPaused: false },
        trigger: { isEnabled: false, isPaused: false },
      },
      toggleSidebarSection: vi.fn(),
      toggleSystem: vi.fn(),
      toggleSystemPause: vi.fn(),
      toggleVisualization: vi.fn(),
      visualizations: {
        showBoundingBoxes: false,
        showCollisionPoints: false,
        showForceVectors: false,
        showParticleEmitters: false,
        showPolygons: false,
        showTriggerZones: false,
        showVelocityVectors: false,
      },
    }

    // Mock performance.memory
    vi.stubGlobal('performance', {
      memory: {
        usedJSHeapSize: 1_000_000,
      },
      now: () => 1000,
    })
  })

  it('should show bounding boxes when command key is pressed and entity is hovered', () => {
    // Set up command key and hover state
    GlobalKeyboardState.keys = 1 << 4 // Command key
    Debug.hoveredEntity[eid] = 1

    const debugSystem = createDebugSystem(mockDebugStore)
    debugSystem(world)

    // Verify bounding box is shown
    expect(Debug.showBoundingBox[eid]).toBe(1)
    expect(mockDebugStore.toggleVisualization).toHaveBeenCalledWith(
      'showBoundingBoxes',
    )
  })

  it('should select entity when command key is pressed and entity is clicked', () => {
    // Set up command key and click state
    GlobalKeyboardState.keys = 1 << 4 // Command key
    Debug.clickedEntity[eid] = 1

    const debugSystem = createDebugSystem(mockDebugStore)
    debugSystem(world)

    // Verify entity was selected
    expect(Debug.isSelected[eid]).toBe(1)
    expect(mockDebugStore.setSelectedEntityId).toHaveBeenCalledWith(eid)
  })

  it('should update performance metrics periodically', () => {
    const debugSystem = createDebugSystem(mockDebugStore)
    debugSystem(world)

    // Verify metrics were updated
    expect(mockDebugStore.metrics?.performance.memoryUsage).toBe(1_000_000)
  })

  it('should sync debug store state with components', () => {
    // Set up debug flags
    Debug.showBoundingBox[eid] = 1
    Debug.showColliders[eid] = 1
    Debug.showForceVectors[eid] = 1
    Debug.showVelocityVector[eid] = 1
    Debug.showTriggerZones[eid] = 1

    const debugSystem = createDebugSystem(mockDebugStore)
    debugSystem(world)

    // Verify all visualizations were synced
    expect(mockDebugStore.toggleVisualization).toHaveBeenCalledWith(
      'showBoundingBoxes',
    )
    expect(mockDebugStore.toggleVisualization).toHaveBeenCalledWith(
      'showCollisionPoints',
    )
    expect(mockDebugStore.toggleVisualization).toHaveBeenCalledWith(
      'showForceVectors',
    )
    expect(mockDebugStore.toggleVisualization).toHaveBeenCalledWith(
      'showVelocityVectors',
    )
    expect(mockDebugStore.toggleVisualization).toHaveBeenCalledWith(
      'showTriggerZones',
    )
  })

  it('should reset debug flags when command key is not pressed', () => {
    // Set up initial debug flags
    Debug.showBoundingBox[eid] = 1
    Debug.showColliders[eid] = 1
    Debug.showForceVectors[eid] = 1
    Debug.showVelocityVector[eid] = 1
    Debug.showTriggerZones[eid] = 1

    // Run system without command key pressed
    const debugSystem = createDebugSystem(mockDebugStore)
    debugSystem(world)

    // Verify debug flags were reset
    expect(Debug.showBoundingBox[eid]).toBe(0)
    expect(Debug.showColliders[eid]).toBe(0)
    expect(Debug.showForceVectors[eid]).toBe(0)
    expect(Debug.showVelocityVector[eid]).toBe(0)
    expect(Debug.showTriggerZones[eid]).toBe(0)
  })

  it('should update debug state', () => {
    const world = {
      ...initialGameWorldState,
      timing: { delta: 1 / 60, elapsed: 0, lastFrame: performance.now() },
    }
    const debugStore = {
      isEnabled: true,
      showBoundingBox: false,
      showColliders: false,
      showGrid: false,
      showTriggerZones: false,
    }
    const debugSystem = createDebugSystem(debugStore as unknown as DebugStore)

    // Create debug entity
    const debugEid = addEntity(world)
    addComponent(world, debugEid, Debug)
    addComponent(world, debugEid, Transform)

    // Set initial position
    Transform.x[debugEid] = 0
    Transform.y[debugEid] = 0

    // Run debug system
    debugSystem(world)

    // Debug state should be updated
    expect(Debug.frameTime[debugEid]).toBe(world.timing.delta)
    expect(Debug.lastUpdated[debugEid]).toBeGreaterThan(0)
  })
})
