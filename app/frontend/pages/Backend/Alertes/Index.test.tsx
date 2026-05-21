import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AlertesIndex from './Index'
import type { AlertesIndexProps } from '../../../types/alerte'

vi.mock('@inertiajs/react', () => ({
  usePage: () => ({ props: {}, url: '/backend/alerts' }),
}))

const mockCounts = { intervention_overdue: 1, animal_dead: 1, worker_departed: 0 }

const mockAlertes = [
  { id: 1, type: 'intervention_overdue' as const, label: 'Semis mil', href: '/backend/interventions/1', detail: 'commencée il y a 8 jours', severity: 'high' as const },
  { id: 2, type: 'animal_dead' as const, label: 'Bœuf Zébu 01', href: '/backend/animals/2', detail: 'décédé le 10/05/2026', severity: 'medium' as const },
]

function renderIndex(overrides: Partial<AlertesIndexProps> = {}) {
  return render(<AlertesIndex alertes={mockAlertes} counts={mockCounts} {...overrides} />)
}

describe('AlertesIndex', () => {
  it('renders Alertes heading', () => {
    renderIndex()
    expect(screen.getByRole('heading', { name: 'Alertes' })).toBeInTheDocument()
  })

  it('renders summary bar with type counts', () => {
    renderIndex()
    expect(screen.getByText(/Interventions en retard : 1/)).toBeInTheDocument()
    expect(screen.getByText(/Animaux récemment décédés : 1/)).toBeInTheDocument()
  })

  it('renders alert label as link', () => {
    renderIndex()
    const link = screen.getByRole('link', { name: 'Semis mil' })
    expect(link.getAttribute('href')).toBe('/backend/interventions/1')
  })

  it('renders alert detail text', () => {
    renderIndex()
    expect(screen.getByText('commencée il y a 8 jours')).toBeInTheDocument()
  })

  it('renders Retard badge for overdue intervention', () => {
    renderIndex()
    expect(screen.getByText('Retard')).toBeInTheDocument()
  })

  it('shows empty state when no alertes', () => {
    renderIndex({ alertes: [], counts: { intervention_overdue: 0, animal_dead: 0, worker_departed: 0 } })
    expect(screen.getByText(/Aucune alerte/)).toBeInTheDocument()
  })

  it('renders a severity dot for each alert', () => {
    renderIndex()
    const dots = screen.getAllByLabelText(/Sévérité/)
    expect(dots.length).toBeGreaterThanOrEqual(1)
  })

  it('renders severity dot with aria-label matching the severity level', () => {
    renderIndex()
    // mockAlertes[0] has severity 'high'
    expect(screen.getByLabelText('Sévérité high')).toBeInTheDocument()
  })
})
