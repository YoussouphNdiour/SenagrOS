import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { usePage, router } from '@inertiajs/react'
import CampagnesForm from './Form'

vi.mocked(usePage).mockReturnValue({
  props: {
    appShell: { farm: { name: 'Ferme' }, campaign: null, user: { name: 'Test', initials: 'T' } },
  },
  url: '/backend/campaigns/new',
  component: 'Backend/Campagnes/Form',
  version: '1',
  encryptHistory: false,
  clearHistory: false,
} as unknown as ReturnType<typeof usePage>)

describe('CampagnesForm — création', () => {
  it('affiche le titre "Nouvelle campagne"', () => {
    render(<CampagnesForm campagne={null} errors={{}} />)
    expect(screen.getByText(/nouvelle campagne/i)).toBeInTheDocument()
  })

  it('affiche les champs Nom et Année de récolte', () => {
    render(<CampagnesForm campagne={null} errors={{}} />)
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/année/i)).toBeInTheDocument()
  })

  it('affiche un bouton de soumission', () => {
    render(<CampagnesForm campagne={null} errors={{}} />)
    expect(screen.getByRole('button', { name: /créer|enregistrer/i })).toBeInTheDocument()
  })

  it('affiche un lien retour vers la liste', () => {
    render(<CampagnesForm campagne={null} errors={{}} />)
    expect(screen.getByRole('link', { name: /retour|annuler/i })).toBeInTheDocument()
  })
})

describe('CampagnesForm — édition', () => {
  const campagne = { id: 1, name: 'Hivernage 2024', harvest_year: 2024, description: 'Test', closed: false }

  it('affiche le titre "Modifier la campagne"', () => {
    render(<CampagnesForm campagne={campagne} errors={{}} />)
    expect(screen.getByText(/modifier/i)).toBeInTheDocument()
  })

  it('pré-remplit le champ Nom', () => {
    render(<CampagnesForm campagne={campagne} errors={{}} />)
    expect(screen.getByDisplayValue('Hivernage 2024')).toBeInTheDocument()
  })

  it('affiche les erreurs de validation', () => {
    render(<CampagnesForm campagne={null} errors={{ name: 'est vide', harvest_year: 'est invalide' }} />)
    expect(screen.getAllByText('est vide').length).toBeGreaterThanOrEqual(1)
  })
})
