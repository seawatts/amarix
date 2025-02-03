'use client'

import { memo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  YAxis,
} from 'recharts'
import { quantile } from 'simple-statistics'

import type { DataPoint } from '../../lib/ecs/types'

interface MetricChartProps {
  data: DataPoint[]
  label: string
  minDomain: number
  maxDomain: number | 'auto'
}

function MetricChartComponent({
  data,
  label,
  minDomain,
  maxDomain,
}: MetricChartProps) {
  const values = data.map((d) => d.value)
  const p0 = values.length > 0 ? Math.min(...values) : 0 // min
  const p50 = quantile(values, 0.5) // median
  const p95 = quantile(values, 0.95)
  const p99 = quantile(values, 0.99)
  const p100 = values.length > 0 ? Math.max(...values) : 0 // max

  const padding = (p100 - p0) * 0.1 // 10% padding
  const yMin = Math.max(minDomain, p0 - padding)
  const yMax = maxDomain === 'auto' ? p100 + padding : maxDomain
  const numberFormatter = new Intl.NumberFormat('en-US', {
    compactDisplay: 'short',
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
    notation: 'compact',
    unitDisplay: 'short',
  })

  return (
    <div
      className="space-y-1 group-data-[collapsible=icon]:hidden"
      data-testid={`metric-chart-${label}`}
    >
      <div
        className="grid grid-cols-5 gap-1 px-1 text-center text-[10px] text-muted-foreground"
        data-testid={`metric-chart-percentiles-${label}`}
      >
        <div className="flex flex-col" data-testid={`metric-chart-p0-${label}`}>
          <span>P0</span>
          <span className="break-words">{numberFormatter.format(p0)}</span>
        </div>
        <div
          className="flex flex-col"
          data-testid={`metric-chart-p50-${label}`}
        >
          <span>P50</span>
          <span className="break-words">{numberFormatter.format(p50)}</span>
        </div>
        <div
          className="flex flex-col"
          data-testid={`metric-chart-p95-${label}`}
        >
          <span>P95</span>
          <span className="break-words">{numberFormatter.format(p95)}</span>
        </div>
        <div
          className="flex flex-col"
          data-testid={`metric-chart-p99-${label}`}
        >
          <span>P99</span>
          <span className="break-words">{numberFormatter.format(p99)}</span>
        </div>
        <div
          className="flex flex-col"
          data-testid={`metric-chart-p100-${label}`}
        >
          <span>P100</span>
          <span className="break-words">{numberFormatter.format(p100)}</span>
        </div>
      </div>
      <div
        className="h-32 w-full rounded-md border bg-background p-2"
        data-testid={`metric-chart-container-${label}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--chart-4))"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--chart-4))"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--muted-foreground))"
              opacity={0.2}
            />
            <YAxis
              domain={[yMin, yMax]}
              stroke="hsl(var(--muted-foreground))"
              width={25}
              tickLine={false}
              axisLine={false}
              fontSize={10}
              tickCount={5}
              tickFormatter={(value: number) => `${value.toFixed(1)}${label}`}
            />
            <ReferenceLine
              y={p50}
              stroke="hsl(var(--chart-1))"
              strokeDasharray="3 3"
              opacity={0.5}
              label={{
                fill: 'hsl(var(--chart-1))',
                fontSize: 9,
                position: 'right',
                value: 'P50',
              }}
            />
            <ReferenceLine
              y={p95}
              stroke="hsl(var(--chart-2))"
              strokeDasharray="3 3"
              opacity={0.5}
              label={{
                fill: 'hsl(var(--chart-2))',
                fontSize: 9,
                position: 'right',
                value: 'P95',
              }}
            />
            <ReferenceLine
              y={p99}
              stroke="hsl(var(--chart-3))"
              strokeDasharray="3 3"
              opacity={0.5}
              label={{
                fill: 'hsl(var(--chart-3))',
                fontSize: 9,
                position: 'right',
                value: 'P99',
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--chart-4))"
              fill="url(#fillValue)"
              fillOpacity={0.4}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export const MetricChart = memo(MetricChartComponent)
