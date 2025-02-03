'use client'

import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { memo } from 'react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@acme/ui/collapsible'
import { SidebarMenuButton, SidebarMenuItem } from '@acme/ui/sidebar'

import type { DataPoint } from '../../lib/ecs/types'
import { MetricChart } from './metric-chart'

interface PerformanceMetricProps {
  label: string
  value: number
  data: DataPoint[]
  icon?: LucideIcon
  unit: string
  minDomain?: number
  maxDomain?: number | 'auto'
  formatValue?: (value: number) => string
}

function PerformanceMetricComponent({
  label,
  value,
  data,
  icon: Icon,
  unit,
  minDomain = 0,
  maxDomain = 'auto',
  formatValue = (v) => v.toFixed(0),
}: PerformanceMetricProps) {
  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible"
        data-testid={`performance-metric-${label}`}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton data-testid={`performance-metric-button-${label}`}>
            {Icon && <Icon className="size-4" />}
            <span data-testid={`performance-metric-value-${label}`}>
              {label}: {formatValue(value)} {unit}
            </span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div
            className="px-2 py-1"
            data-testid={`performance-metric-chart-${label}`}
          >
            <MetricChart
              data={data}
              label={unit}
              minDomain={minDomain}
              maxDomain={maxDomain}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}

export const PerformanceMetric = memo(PerformanceMetricComponent)
