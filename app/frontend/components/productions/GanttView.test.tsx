import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GanttView } from './GanttView'
import type { Production } from '../../types/production'

const p1: Production = {
  id: 1,
  name: 'Mil',
  started_on: '2025-01-01',
  stopped_on: '2025-06-30',
  state: 'opened',
  activity: { id: 1, name: 'Mil', family: 'plant_farming' },
  cultivable_zone: null,
  campaign: { id: 1, name: 'H2025', harvest_year: 2025 },
}

const p2: Production = {
  id: 2,
  name: 'Maïs',
  started_on: '2025-03-01',
  stopped_on: '2025-09-30',
  state: 'finished',
  activity: { id: 2, name: 'Maïs', family: 'plant_farming' },
  cultivable_zone: null,
  campaign: { id: 1, name: 'H2025', harvest_year: 2025 },
}

describe('GanttView', () => {
  it('renders null for empty productions', () => {
    const { queryByTestId } = render(<GanttView productions={[]} />)
    expect(queryByTestId('gantt-view')).toBeNull()
  })

  it('renders one bar per production', () => {
    render(<GanttView productions={[p1, p2]} />)
    const bars = screen.getAllByTestId('gantt-bar')
    expect(bars).toHaveLength(2)
  })

  it('bar left position reflects date offset', () => {
    render(<GanttView productions={[p1, p2]} />)
    const bars = screen.getAllByTestId('gantt-bar')
    const leftP1 = parseFloat(bars[0].style.left)
    const leftP2 = parseFloat(bars[1].style.left)
    expect(leftP2).toBeGreaterThan(leftP1)
  })

  it('renders gantt-view container', () => {
    render(<GanttView productions={[p1]} />)
    expect(screen.getByTestId('gantt-view')).toBeInTheDocument()
  })
})
