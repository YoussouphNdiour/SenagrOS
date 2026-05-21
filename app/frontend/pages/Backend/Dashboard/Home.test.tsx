import { render, screen } from '@testing-library/react'
import Home from './Home'
import type { DashboardHomeProps, DashboardAlert } from '../../../types/dashboard'

const defaultProps: DashboardHomeProps = {
  kpis: {
    campaign: { name: 'Hivernage 2025', started_on: '2025-06-01', stopped_on: null },
    area_ha: 12.5,
    interventions: { active: 3, scheduled: 2 },
    expenses_xof: null,
    workers_count: 5,
    productions_count: 3,
    animals_count: 8,
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
  alerts: [],
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

  it('renders Animaux vivants KPI with animals_count value', () => {
    render(<Home {...defaultProps} />)
    expect(screen.getByText('Animaux vivants')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('hides alertes section when alerts is empty', () => {
    render(<Home {...defaultProps} />)
    expect(screen.queryByText('Alertes')).not.toBeInTheDocument()
  })

  it('shows alertes section with alert items when alerts is non-empty', () => {
    const alerts: DashboardAlert[] = [
      {
        type: 'animal_dead',
        label: 'Vache Bêta',
        href: '/backend/animals/42',
        detail: 'décédé le 15/05/2026',
      },
    ]
    render(<Home {...defaultProps} alerts={alerts} />)
    expect(screen.getByText('Alertes')).toBeInTheDocument()
    expect(screen.getByText('Vache Bêta')).toBeInTheDocument()
    expect(screen.getByText('décédé le 15/05/2026')).toBeInTheDocument()
  })

  it('shows Retard badge for intervention_overdue alert type', () => {
    const alerts: DashboardAlert[] = [
      {
        type: 'intervention_overdue',
        label: 'Traitement herbicide',
        href: '/backend/interventions/7',
        detail: 'commencée il y a 10 jours',
      },
    ]
    render(<Home {...defaultProps} alerts={alerts} />)
    expect(screen.getByText('Retard')).toBeInTheDocument()
    expect(screen.getByText('Traitement herbicide')).toBeInTheDocument()
  })
})
