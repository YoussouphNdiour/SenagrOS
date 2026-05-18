import { render, screen } from '@testing-library/react'
import Home from './Home'
import type { DashboardHomeProps } from '../../../types/dashboard'

const defaultProps: DashboardHomeProps = {
  kpis: {
    campaign: { name: 'Hivernage 2025', started_on: '2025-06-01', stopped_on: null },
    area_ha: 12.5,
    interventions: { active: 3, scheduled: 2 },
    expenses_xof: null,
    workers_count: 5,
    productions_count: 3,
  },
  parcelles: [
    {
      id: 1,
      name: 'Parcelle Nord',
      area_ha: 5.2,
      geojson: '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[]}}',
    },
  ],
  recent_activity: [
    { id: 1, name: 'Semis mil', state: 'done', started_at: '2025-06-10T08:00:00Z' },
  ],
  weather: {
    temperature: 34,
    description: 'Ensoleillé',
    icon: '01d',
    forecast: [{ day: 'Jeu', temp_max: 36, temp_min: 28, icon: '01d' }],
  },
  farm: { name: 'Ferme Baobab', locale: 'fr', timezone: 'Africa/Dakar' },
}

describe('Dashboard Home', () => {
  it('renders farm name', () => {
    render(<Home {...defaultProps} />)
    expect(screen.getByText('Ferme Baobab')).toBeInTheDocument()
  })

  it('renders 6 KPI cards', () => {
    render(<Home {...defaultProps} />)
    expect(screen.getByText('Campagne')).toBeInTheDocument()
    expect(screen.getByText('Surfaces cultivées')).toBeInTheDocument()
    expect(screen.getByText('Interventions actives')).toBeInTheDocument()
    expect(screen.getByText('Interventions planifiées')).toBeInTheDocument()
    expect(screen.getByText('Travailleurs actifs')).toBeInTheDocument()
    expect(screen.getByText('Productions')).toBeInTheDocument()
  })

  it('renders KPI values', () => {
    render(<Home {...defaultProps} />)
    expect(screen.getByText('Hivernage 2025')).toBeInTheDocument()
    expect(screen.getByText('12.5')).toBeInTheDocument()
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1)
  })

  it('renders new KPI cards', () => {
    render(<Home {...defaultProps} />)
    expect(screen.getByText('Travailleurs actifs')).toBeInTheDocument()
    expect(screen.getByText('Productions')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1)
  })

  it('renders map and activity feed', () => {
    render(<Home {...defaultProps} />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
    expect(screen.getByText('Semis mil')).toBeInTheDocument()
  })
})
