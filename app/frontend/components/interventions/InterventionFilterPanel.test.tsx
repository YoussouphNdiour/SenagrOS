import { render, screen, fireEvent } from '@testing-library/react'
import { InterventionFilterPanel } from './InterventionFilterPanel'
import type { InterventionFilters } from '../../types/intervention'

const defaultMeta = {
  procedures: [
    { label: 'Semis', value: 'sowing' },
    { label: 'Traitement', value: 'spraying' },
  ],
}

describe('InterventionFilterPanel', () => {
  it('affiche le champ de recherche texte', () => {
    render(
      <InterventionFilterPanel
        filters={{}}
        meta={defaultMeta}
        onChange={() => {}}
      />
    )
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument()
  })

  it('affiche la valeur courante du filtre texte', () => {
    const filters: InterventionFilters = { q: 'semis' }
    render(
      <InterventionFilterPanel filters={filters} meta={defaultMeta} onChange={() => {}} />
    )
    expect(screen.getByDisplayValue('semis')).toBeInTheDocument()
  })

  it('affiche le sélecteur d\'état', () => {
    render(
      <InterventionFilterPanel filters={{}} meta={defaultMeta} onChange={() => {}} />
    )
    expect(screen.getByLabelText(/état/i)).toBeInTheDocument()
  })

  it('appelle onChange avec le nouvel état sélectionné', () => {
    const onChange = vi.fn()
    render(
      <InterventionFilterPanel filters={{}} meta={defaultMeta} onChange={onChange} />
    )
    fireEvent.change(screen.getByLabelText(/état/i), { target: { value: 'done' } })
    expect(onChange).toHaveBeenCalledWith({ state: ['done'], page: 1 })
  })

  it('appelle onChange avec nature vide quand "Toutes" est sélectionné', () => {
    const onChange = vi.fn()
    render(
      <InterventionFilterPanel
        filters={{ nature: ['record'] }}
        meta={defaultMeta}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByLabelText(/nature/i), { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith({ nature: undefined, page: 1 })
  })

  it('affiche le bouton Réinitialiser quand un filtre est actif', () => {
    render(
      <InterventionFilterPanel
        filters={{ q: 'test' }}
        meta={defaultMeta}
        onChange={() => {}}
      />
    )
    expect(screen.getByText(/réinitialiser/i)).toBeInTheDocument()
  })

  it('n\'affiche pas Réinitialiser quand aucun filtre n\'est actif', () => {
    render(
      <InterventionFilterPanel filters={{}} meta={defaultMeta} onChange={() => {}} />
    )
    expect(screen.queryByText(/réinitialiser/i)).not.toBeInTheDocument()
  })

  it('appelle onChange avec tous les filtres vides au clic sur Réinitialiser', () => {
    const onChange = vi.fn()
    render(
      <InterventionFilterPanel
        filters={{ q: 'test', state: ['done'] }}
        meta={defaultMeta}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByText(/réinitialiser/i))
    expect(onChange).toHaveBeenCalledWith({
      q: undefined, state: undefined, nature: undefined,
      procedure_name_id: undefined, page: 1,
    })
  })
})
