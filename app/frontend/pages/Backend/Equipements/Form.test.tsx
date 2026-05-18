import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { usePage } from '@inertiajs/react'
import EquipementsForm from './Form'

beforeEach(() => {
  vi.mocked(usePage).mockReturnValue({
    props: {
      appShell: { farm: { name: 'Ferme' }, campaign: null, user: { name: 'Test', initials: 'T' } },
    },
    url: '/backend/equipments/new',
    component: 'Backend/Equipements/Form',
    version: '1',
    encryptHistory: false,
    clearHistory: false,
  } as unknown as ReturnType<typeof usePage>)
})

describe('EquipementsForm — création', () => {
  it('affiche le titre "Nouvel équipement"', () => {
    render(<EquipementsForm equipement={null} errors={{}} />)
    expect(screen.getByText(/nouvel équipement/i)).toBeInTheDocument()
  })

  it('affiche le champ Nom', () => {
    render(<EquipementsForm equipement={null} errors={{}} />)
    expect(screen.getByLabelText(/^nom/i)).toBeInTheDocument()
  })

  it('affiche un bouton de soumission', () => {
    render(<EquipementsForm equipement={null} errors={{}} />)
    expect(screen.getByRole('button', { name: /créer|enregistrer/i })).toBeInTheDocument()
  })

  it('affiche un lien retour', () => {
    render(<EquipementsForm equipement={null} errors={{}} />)
    expect(screen.getByRole('link', { name: /retour|annuler/i })).toBeInTheDocument()
  })
})

describe('EquipementsForm — édition', () => {
  const equipement = {
    id: 1,
    name: 'Tracteur John Deere',
    work_number: 'TJD-01',
    description: 'Tracteur principal',
    born_at: '2020-01-15',
    dead_at: null,
  }

  it('affiche le titre "Modifier"', () => {
    render(<EquipementsForm equipement={equipement} errors={{}} />)
    expect(screen.getByText(/modifier/i)).toBeInTheDocument()
  })

  it('pré-remplit le champ Nom', () => {
    render(<EquipementsForm equipement={equipement} errors={{}} />)
    expect(screen.getByDisplayValue('Tracteur John Deere')).toBeInTheDocument()
  })

  it('pré-remplit le numéro de travail', () => {
    render(<EquipementsForm equipement={equipement} errors={{}} />)
    expect(screen.getByDisplayValue('TJD-01')).toBeInTheDocument()
  })

  it('affiche les erreurs de validation', () => {
    render(<EquipementsForm equipement={null} errors={{ name: 'est vide' }} />)
    expect(screen.getByText('est vide')).toBeInTheDocument()
  })
})
