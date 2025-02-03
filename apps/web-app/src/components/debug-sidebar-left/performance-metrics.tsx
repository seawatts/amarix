'use client'

import { startCase } from 'lodash-es'
import {
  Activity,
  ChevronRight,
  Gauge,
  LayoutDashboard,
  Timer,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@acme/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuSub,
} from '@acme/ui/sidebar'

import type { DataPoint } from '~/lib/ecs/types'
import { RingBuffer } from '~/lib/ecs/types'
import { useDebugStore } from '~/providers/debug-provider'
import { useGame } from '~/providers/game-provider'
import { PerformanceMetric } from './performance-metric'

type SystemHistory = Record<string, RingBuffer<DataPoint>>

export function PerformanceMetrics() {
  const engine = useGame((state) => state.engine)
  const isPerformanceOpen = useDebugStore(
    (state) => state.sidebarSections.performance,
  )
  const toggleSidebarSection = useDebugStore(
    (state) => state.toggleSidebarSection,
  )
  const fps = useDebugStore((state) => state.metrics?.performance.fps)
  const frameTime = useDebugStore(
    (state) => state.metrics?.performance.frameTime,
  )
  const memoryUsage = useDebugStore(
    (state) => state.metrics?.performance.memoryUsage,
  )
  const systems = useDebugStore((state) => state.metrics?.performance.systems)
  const [fpsBuffer] = useState(() => new RingBuffer<DataPoint>(100))
  const [frameTimeBuffer] = useState(() => new RingBuffer<DataPoint>(100))
  const [memoryBuffer] = useState(() => new RingBuffer<DataPoint>(100))
  const [systemBuffers] = useState<SystemHistory>({})

  useEffect(() => {
    const timestamp = Date.now()

    if (fps !== undefined) {
      fpsBuffer.push({
        timestamp,
        value: fps,
      })
    }

    if (frameTime !== undefined) {
      frameTimeBuffer.push({
        timestamp,
        value: frameTime,
      })
    }

    if (memoryUsage !== undefined) {
      memoryBuffer.push({
        timestamp,
        value: memoryUsage,
      })
    }

    if (systems) {
      for (const [name, time] of Object.entries(systems)) {
        if (!systemBuffers[name]) {
          systemBuffers[name] = new RingBuffer<DataPoint>(100)
        }
        systemBuffers[name].push({
          timestamp,
          value: time,
        })
      }
    }
  }, [
    fps,
    frameTime,
    memoryUsage,
    systems,
    fpsBuffer,
    frameTimeBuffer,
    memoryBuffer,
    systemBuffers,
  ])

  if (!engine) return null

  const memoryMB = memoryUsage ? memoryUsage / 1024 / 1024 : 0

  return (
    <SidebarGroup>
      <Collapsible
        className="group/performance"
        data-testid="performance-metrics"
        open={isPerformanceOpen}
        onOpenChange={() => toggleSidebarSection('performance')}
      >
        <CollapsibleTrigger
          className="w-full"
          data-testid="performance-metrics-trigger"
        >
          <SidebarGroupLabel>
            <div
              className="flex w-full items-center justify-between"
              data-testid="performance-metrics-header"
            >
              <div
                className="flex items-center gap-2"
                data-testid="performance-metrics-title"
              >
                <Gauge className="size-4" />
                <span>Performance</span>
              </div>
              <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/performance:rotate-90" />
            </div>
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu data-testid="performance-metrics-menu">
              <PerformanceMetric
                label="FPS"
                value={fps ?? 0}
                data={fpsBuffer.toArray()}
                icon={Gauge}
                unit=""
                minDomain={0}
                maxDomain={100}
                formatValue={(v) => Math.round(v).toString()}
                data-testid="performance-metrics-fps"
              />
              <PerformanceMetric
                label="Frame Time"
                value={frameTime ?? 0}
                data={frameTimeBuffer.toArray()}
                icon={Activity}
                unit="ms"
                minDomain={0}
                maxDomain={100}
                data-testid="performance-metrics-frame-time"
              />
              <PerformanceMetric
                label="Memory"
                value={memoryMB}
                data={memoryBuffer.toArray()}
                icon={LayoutDashboard}
                unit="MB"
                minDomain={0}
                maxDomain="auto"
                data-testid="performance-metrics-memory"
              />
              <Collapsible
                className="group/collapsible"
                data-testid="performance-metrics-systems"
              >
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip="Systems"
                    data-testid="performance-metrics-systems-button"
                  >
                    <Timer className="size-4" />
                    <span data-testid="performance-metrics-systems-label">
                      Systems
                    </span>
                    <span data-testid="performance-metrics-systems-total">
                      {Object.values(systems ?? {})
                        .reduce((sum, time) => sum + time, 0)
                        .toFixed(2)}{' '}
                      ms
                    </span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <SidebarMenuSub>
                  <CollapsibleContent data-testid="performance-metrics-systems-content">
                    {Object.entries(systems ?? {}).map(([name, time]) => (
                      <PerformanceMetric
                        key={name}
                        label={startCase(name.replaceAll('System', ''))}
                        value={time}
                        data={systemBuffers[name]?.toArray() ?? []}
                        unit="ms"
                        minDomain={0}
                        maxDomain="auto"
                        formatValue={(v) => v.toFixed(2)}
                        data-testid={`performance-metrics-system-${name}`}
                      />
                    ))}
                  </CollapsibleContent>
                </SidebarMenuSub>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  )
}
