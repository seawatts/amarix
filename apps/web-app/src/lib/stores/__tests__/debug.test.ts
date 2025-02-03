import { addEntity, createWorld } from 'bitecs'
import { describe, expect, it, vi } from 'vitest'

import type { WorldProps } from '~/lib/ecs/types'
import { Debug, Named } from '../../ecs/components'
import { createDebugStore, defaultInitState } from '../debug'

describe('Debug Store', () => {
  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const store = createDebugStore()
      const state = store.getState()

      expect(state.selectedEntityId).toBeNull()
      expect(state.metrics).toBeNull()

      // Check default system states
      expect(state.systems.animation).toBe(true)
      expect(state.systems.battle).toBe(true)
      expect(state.systems.collision).toBe(true)
      expect(state.systems.keyboard).toBe(true)
      expect(state.systems.mouse).toBe(true)
      expect(state.systems.movement).toBe(true)
      expect(state.systems.npcInteraction).toBe(true)
      expect(state.systems.particle).toBe(true)
      expect(state.systems.physics).toBe(true)
      expect(state.systems.scene).toBe(true)
      expect(state.systems.script).toBe(true)
      expect(state.systems.sound).toBe(true)
      expect(state.systems.sprite).toBe(true)
      expect(state.systems.trigger).toBe(true)

      // Check default visualization states
      expect(state.visualizations.showBoundingBoxes).toBe(false)
      expect(state.visualizations.showCollisionPoints).toBe(false)
      expect(state.visualizations.showForceVectors).toBe(false)
      expect(state.visualizations.showParticleEmitters).toBe(false)
      expect(state.visualizations.showPolygons).toBe(false)
      expect(state.visualizations.showTriggerZones).toBe(false)
      expect(state.visualizations.showVelocityVectors).toBe(false)
    })

    it('should initialize with custom state', () => {
      const customState = {
        ...defaultInitState,
        selectedEntityId: 1,
        systems: {
          ...defaultInitState.systems,
          animation: { isEnabled: false, isPaused: false },
        },
        visualizations: {
          ...defaultInitState.visualizations,
          showBoundingBoxes: true,
        },
      }

      const store = createDebugStore(customState)
      const state = store.getState()

      expect(state.selectedEntityId).toBe(1)
      expect(state.systems.animation).toBe(false)
      expect(state.visualizations.showBoundingBoxes).toBe(true)
    })
  })

  describe('State Updates', () => {
    it('should update selected entity', () => {
      const store = createDebugStore()
      store.getState().setSelectedEntityId(42)

      expect(store.getState().selectedEntityId).toBe(42)
    })

    it('should toggle system state', () => {
      const store = createDebugStore()
      const { toggleSystem } = store.getState()

      // Toggle animation system off
      toggleSystem('animation')
      expect(store.getState().systems.animation).toBe(false)

      // Toggle animation system back on
      toggleSystem('animation')
      expect(store.getState().systems.animation).toBe(true)
    })

    it('should toggle visualization state', () => {
      const store = createDebugStore()
      const { toggleVisualization } = store.getState()

      // Toggle bounding boxes on
      toggleVisualization('showBoundingBoxes')
      expect(store.getState().visualizations.showBoundingBoxes).toBe(true)

      // Toggle bounding boxes off
      toggleVisualization('showBoundingBoxes')
      expect(store.getState().visualizations.showBoundingBoxes).toBe(false)
    })
  })

  it('should collect entity metrics', () => {
    const world = createWorld<WorldProps>()
    const store = createDebugStore()
    const eid = addEntity(world)

    // Add some component data
    Named.name[eid] = 'Test Entity'
    Debug.logLevel[eid] = 3

    const metrics = store.getState().metrics

    expect(metrics).toBeDefined()
    if (!metrics) return

    expect(metrics.entities).toHaveLength(1)
    const entity = metrics.entities[0]
    expect(entity).toBeDefined()
    if (!entity) return

    interface EntityComponent {
      data: Record<string, unknown>
      component: Record<string, unknown>
    }

    interface Entity {
      id: number
      name?: string
      components: Record<string, EntityComponent>
    }

    const typedEntity = entity as Entity

    expect(typedEntity.id).toBe(eid)
    expect(typedEntity.name).toBe('Test Entity')
    expect(typedEntity.components.Named).toBeDefined()
    expect(typedEntity.components.Named?.data.name).toBe('Test Entity')
    expect(typedEntity.components.Debug).toBeDefined()
    expect(typedEntity.components.Debug?.data.logLevel).toBe(3)
  })

  it('should collect performance metrics', () => {
    const store = createDebugStore()
    store.getState().handleDebugEvent({
      data: {
        metrics: {
          fps: 60,
          frameTime: 16.67,
          memoryUsage: 1_000_000,
          systems: { TestSystem: 16 },
        },
      },
      type: 'metricsUpdated',
    })

    const metrics = store.getState().metrics
    expect(metrics?.performance).toMatchObject({
      fps: expect.any(Number),
      frameTime: expect.any(Number),
      memoryUsage: 1_000_000,
      systems: {
        GameState: expect.any(Number),
        TestSystem: 16,
      },
    })
  })

  it('should handle undefined memory metrics', () => {
    const mockPerformance = {
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
      clearResourceTimings: vi.fn(),
      eventCounts: {} as PerformanceEventMap,
      getEntries: vi.fn(),
      getEntriesByName: vi.fn(),
      getEntriesByType: vi.fn(),
      mark: vi.fn(),
      measure: vi.fn(),
      memory: undefined,
      navigation: {} as PerformanceNavigation,
      now: () => 1000,
      onresourcetimingbufferfull: null,
      setResourceTimingBufferSize: vi.fn(),
      timeOrigin: 0,
      timing: {} as PerformanceTiming,
      toJSON: vi.fn(),
    }
    globalThis.performance = mockPerformance as unknown as Performance

    const store = createDebugStore()
    store.getState().handleDebugEvent({
      data: {
        metrics: {
          systems: { TestSystem: 16 },
        },
      },
      type: 'metricsUpdated',
    })

    const metrics = store.getState().metrics
    expect(metrics?.performance.memoryUsage).toBe(0)
  })
})
