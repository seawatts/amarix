import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MetricChart } from '../metric-chart'

describe('MetricChart', () => {
  const mockData = [
    { timestamp: Date.now() - 2000, value: 10 },
    { timestamp: Date.now() - 1000, value: 20 },
    { timestamp: Date.now(), value: 30 },
  ]

  // Mock getBoundingClientRect to return non-zero dimensions
  const getBoundingClientRect = Element.prototype.getBoundingClientRect.bind(
    Element.prototype,
  )
  beforeEach(() => {
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      bottom: 100,
      height: 100,
      left: 0,
      right: 100,
      toJSON: () => ({}),
      top: 0,
      width: 100,
      x: 0,
      y: 0,
    })) as unknown as () => DOMRect
  })

  afterEach(() => {
    Element.prototype.getBoundingClientRect = getBoundingClientRect
  })

  function renderChart(props: {
    data: typeof mockData
    label?: string
    minDomain?: number
    maxDomain?: number | 'auto'
  }) {
    return render(
      <div style={{ height: '100px', width: '100px' }}>
        <MetricChart
          data={props.data}
          label={props.label ?? 'ms'}
          minDomain={props.minDomain ?? 0}
          maxDomain={props.maxDomain ?? 100}
        />
      </div>,
    )
  }

  it('renders with initial data', () => {
    renderChart({ data: mockData })

    const chart = screen.getByTestId('metric-chart-ms')
    expect(chart).toBeInTheDocument()

    const percentiles = screen.getByTestId('metric-chart-percentiles-ms')
    expect(percentiles).toBeInTheDocument()

    // Check if percentile values are displayed using data-test attributes
    expect(screen.getByTestId('metric-chart-p0-ms')).toHaveTextContent(
      'P0: 10.0ms',
    )
    expect(screen.getByTestId('metric-chart-p50-ms')).toHaveTextContent(
      'P50: 20.0ms',
    )
    expect(screen.getByTestId('metric-chart-p95-ms')).toHaveTextContent(
      'P95: 30.0ms',
    )
    expect(screen.getByTestId('metric-chart-p99-ms')).toHaveTextContent(
      'P99: 30.0ms',
    )
    expect(screen.getByTestId('metric-chart-p100-ms')).toHaveTextContent(
      'P100: 30.0ms',
    )

    const container = screen.getByTestId('metric-chart-container-ms')
    expect(container).toBeInTheDocument()
    expect(container).toHaveClass('h-32', 'w-full')
  })

  it('updates when data changes', () => {
    const { rerender } = renderChart({ data: mockData })

    const newData = [...mockData, { timestamp: Date.now() + 1000, value: 40 }]
    rerender(
      <div style={{ height: '100px', width: '100px' }}>
        <MetricChart data={newData} label="ms" minDomain={0} maxDomain={100} />
      </div>,
    )

    // Check if percentile values are updated using data-test attributes
    expect(screen.getByTestId('metric-chart-p0-ms')).toHaveTextContent(
      'P0: 10.0ms',
    )
    expect(screen.getByTestId('metric-chart-p50-ms')).toHaveTextContent(
      'P50: 20.0ms',
    )
    expect(screen.getByTestId('metric-chart-p100-ms')).toHaveTextContent(
      'P100: 40.0ms',
    )
  })

  it('handles empty data', () => {
    renderChart({ data: [] })

    // Check if percentile values are all zero using data-test attributes
    expect(screen.getByTestId('metric-chart-p0-ms')).toHaveTextContent(
      'P0: 0.0ms',
    )
    expect(screen.getByTestId('metric-chart-p50-ms')).toHaveTextContent(
      'P50: 0.0ms',
    )
    expect(screen.getByTestId('metric-chart-p95-ms')).toHaveTextContent(
      'P95: 0.0ms',
    )
    expect(screen.getByTestId('metric-chart-p99-ms')).toHaveTextContent(
      'P99: 0.0ms',
    )
    expect(screen.getByTestId('metric-chart-p100-ms')).toHaveTextContent(
      'P100: 0.0ms',
    )
  })

  it('respects minDomain and maxDomain', () => {
    const data = [{ timestamp: Date.now(), value: 50 }]
    renderChart({ data, maxDomain: 80, minDomain: 20 })

    // Check if percentile values are displayed using data-test attributes
    expect(screen.getByTestId('metric-chart-p0-ms')).toHaveTextContent(
      'P0: 50.0ms',
    )
    expect(screen.getByTestId('metric-chart-p50-ms')).toHaveTextContent(
      'P50: 50.0ms',
    )
    expect(screen.getByTestId('metric-chart-p95-ms')).toHaveTextContent(
      'P95: 50.0ms',
    )
    expect(screen.getByTestId('metric-chart-p99-ms')).toHaveTextContent(
      'P99: 50.0ms',
    )
    expect(screen.getByTestId('metric-chart-p100-ms')).toHaveTextContent(
      'P100: 50.0ms',
    )
  })
})
