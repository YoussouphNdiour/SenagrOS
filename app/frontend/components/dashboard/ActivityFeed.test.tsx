import { render, screen } from '@testing-library/react'
import type { RecentIntervention } from '../../types/dashboard'
import { ActivityFeed } from './ActivityFeed'

const mockInterventions: RecentIntervention[] = [
  { id: 1, name: 'Semis mil', state: 'done', started_at: '2025-05-14T08:00:00Z' },
  { id: 2, name: 'Irrigation parcelle Nord', state: 'in_progress', started_at: '2025-05-15T06:00:00Z' },
  { id: 3, name: 'Désherbage', state: 'planned', started_at: '2025-05-16T07:00:00Z' },
]

const fiveInterventions: RecentIntervention[] = [
  { id: 1, name: 'Semis mil', state: 'done', started_at: '2025-05-10T08:00:00Z' },
  { id: 2, name: 'Irrigation Nord', state: 'in_progress', started_at: '2025-05-11T06:00:00Z' },
  { id: 3, name: 'Désherbage sorgho', state: 'planned', started_at: '2025-05-12T07:00:00Z' },
  { id: 4, name: 'Récolte arachide', state: 'done', started_at: '2025-05-13T09:00:00Z' },
  { id: 5, name: 'Traitement phyto', state: 'in_progress', started_at: '2025-05-14T10:00:00Z' },
]

describe('ActivityFeed', () => {
  it('affiche les noms des interventions', () => {
    render(<ActivityFeed interventions={mockInterventions} />)
    expect(screen.getByText('Semis mil')).toBeInTheDocument()
    expect(screen.getByText('Irrigation parcelle Nord')).toBeInTheDocument()
  })

  it('affiche un badge pour chaque état', () => {
    render(<ActivityFeed interventions={mockInterventions} />)
    expect(screen.getByText('done')).toBeInTheDocument()
    expect(screen.getByText('in_progress')).toBeInTheDocument()
    expect(screen.getByText('planned')).toBeInTheDocument()
  })

  it('affiche un message vide quand la liste est vide', () => {
    render(<ActivityFeed interventions={[]} />)
    expect(screen.getByText('Aucune intervention récente')).toBeInTheDocument()
  })

  it('affiche 5 interventions', () => {
    render(<ActivityFeed interventions={fiveInterventions} />)
    expect(screen.getByText('Semis mil')).toBeInTheDocument()
    expect(screen.getByText('Irrigation Nord')).toBeInTheDocument()
    expect(screen.getByText('Désherbage sorgho')).toBeInTheDocument()
    expect(screen.getByText('Récolte arachide')).toBeInTheDocument()
    expect(screen.getByText('Traitement phyto')).toBeInTheDocument()
  })
})
