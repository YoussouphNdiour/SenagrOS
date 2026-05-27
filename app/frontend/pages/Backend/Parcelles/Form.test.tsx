import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { usePage } from '@inertiajs/react'
import ParcellesForm from './Form'

vi.mocked(usePage).mockReturnValue({
  props: {
    appShell: { farm: { name: 'Ferme' }, campaign: null, user: { name: 'Test', initials: 'T' } },
  },
  url: '/backend/cultivable-zones/new',
  component: 'Backend/Parcelles/Form',
  version: '1',
  encryptHistory: false,
  clearHistory: false,
} as unknown as ReturnType<typeof usePage>)

describe('ParcellesForm — création', () => {
  it('affiche le titre "Nouvelle parcelle"', () => {
    render(<ParcellesForm parcelle={null} errors={{}} />)
    expect(screen.getByText(/nouvelle parcelle/i)).toBeInTheDocument()
  })

  it('affiche le champ Nom', () => {
    render(<ParcellesForm parcelle={null} errors={{}} />)
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument()
  })

  it('affiche un bouton de soumission', () => {
    render(<ParcellesForm parcelle={null} errors={{}} />)
    expect(screen.getByRole('button', { name: /créer|enregistrer/i })).toBeInTheDocument()
  })

  it('affiche un lien retour', () => {
    render(<ParcellesForm parcelle={null} errors={{}} />)
    expect(screen.getByRole('link', { name: /retour|annuler/i })).toBeInTheDocument()
  })
})

describe('ParcellesForm — édition', () => {
  const parcelle = { id: 1, name: 'Champ Nord', description: 'Grand champ', work_number: 'P001' }

  it('affiche le titre "Modifier la parcelle"', () => {
    render(<ParcellesForm parcelle={parcelle} errors={{}} />)
    expect(screen.getByText(/modifier/i)).toBeInTheDocument()
  })

  it('pré-remplit le champ Nom', () => {
    render(<ParcellesForm parcelle={parcelle} errors={{}} />)
    expect(screen.getByDisplayValue('Champ Nord')).toBeInTheDocument()
  })

  it('affiche les erreurs de validation', () => {
    render(<ParcellesForm parcelle={null} errors={{ name: 'est vide' }} />)
    expect(screen.getAllByText('est vide').length).toBeGreaterThanOrEqual(1)
  })
})
