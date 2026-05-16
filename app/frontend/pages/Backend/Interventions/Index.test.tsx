import { render, screen, fireEvent } from '@testing-library/react'
import InterventionsIndex from './Index'
import type { InterventionIndexProps } from '../../../types/intervention'

const defaultProps: InterventionIndexProps = {
  interventions: [],
  kanban: { planned: 3, in_progress: 1, done: 8, validated: 2 },
  map_geojson: { type: 'FeatureCollection', features: [] },
  filters: {},
  meta: { total: 0, page: 1, per_page: 25, procedures: [] },
}

describe('InterventionsIndex', () => {
  it('affiche le panneau de filtres', () => {
    render(<InterventionsIndex {...defaultProps} />)
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument()
  })

  it('affiche la vue table par défaut', () => {
    render(<InterventionsIndex {...defaultProps} />)
    expect(screen.getByText(/aucune intervention/i)).toBeInTheDocument()
  })

  it('affiche les boutons de bascule de vue', () => {
    render(<InterventionsIndex {...defaultProps} />)
    expect(screen.getByText('Liste')).toBeInTheDocument()
    expect(screen.getByText('Tableau')).toBeInTheDocument()
    expect(screen.getByText('Carte')).toBeInTheDocument()
  })

  it('bascule vers la vue kanban au clic sur "Tableau"', () => {
    render(<InterventionsIndex {...defaultProps} />)
    fireEvent.click(screen.getByText('Tableau'))
    expect(screen.getByTestId('count-planned')).toBeInTheDocument()
  })

  it('affiche la carte au clic sur "Carte"', () => {
    render(<InterventionsIndex {...defaultProps} />)
    fireEvent.click(screen.getByText('Carte'))
    expect(screen.getByText(/aucune zone/i)).toBeInTheDocument()
  })

  it('cache la carte au second clic sur "Carte"', () => {
    render(<InterventionsIndex {...defaultProps} />)
    fireEvent.click(screen.getByText('Carte'))
    fireEvent.click(screen.getByText('Carte'))
    expect(screen.queryByText(/aucune zone/i)).not.toBeInTheDocument()
  })

  it('repasse en vue table au clic sur "Liste" depuis kanban', () => {
    render(<InterventionsIndex {...defaultProps} />)
    fireEvent.click(screen.getByText('Tableau'))
    fireEvent.click(screen.getByText('Liste'))
    expect(screen.getByText(/aucune intervention/i)).toBeInTheDocument()
  })
})
