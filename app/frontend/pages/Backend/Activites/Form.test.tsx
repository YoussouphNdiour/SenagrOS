import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { usePage } from '@inertiajs/react'
import ActivitesForm from './Form'

beforeEach(() => {
  vi.mocked(usePage).mockReturnValue({
    props: {
      appShell: { farm: { name: 'Ferme Test' }, campaign: null, user: { name: 'Test', initials: 'T' } },
    },
    url: '/backend/activities/new',
    component: 'Backend/Activites/Form',
    version: '1',
    encryptHistory: false,
    clearHistory: false,
  } as unknown as ReturnType<typeof usePage>)
})

const FAMILIES = [
  { value: 'plant_farming',  label: 'Plant farming' },
  { value: 'animal_farming', label: 'Animal farming' },
]

describe('ActivitesForm — création', () => {
  it('affiche le titre "Nouvelle activité"', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByText(/nouvelle activité/i)).toBeInTheDocument()
  })

  it('affiche le champ Nom', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByLabelText(/^nom/i)).toBeInTheDocument()
  })

  it('affiche le select Famille', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByLabelText(/famille/i)).toBeInTheDocument()
  })

  it('affiche le select Nature', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByLabelText(/nature/i)).toBeInTheDocument()
  })

  it('affiche le select Cycle de production', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByLabelText(/cycle/i)).toBeInTheDocument()
  })

  it('affiche la checkbox Avec supports', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByLabelText(/avec supports/i)).toBeInTheDocument()
  })

  it('affiche la checkbox Suspendue', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByLabelText(/suspendue/i)).toBeInTheDocument()
  })

  it('affiche un bouton de soumission', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByRole('button', { name: /créer|enregistrer/i })).toBeInTheDocument()
  })

  it('affiche un lien Annuler', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByRole('link', { name: /annuler/i })).toBeInTheDocument()
  })
})

describe('ActivitesForm — édition', () => {
  const activite = {
    id: 1,
    name: 'Culture du mil',
    family: 'plant_farming',
    nature: 'main',
    production_cycle: 'annual',
    with_supports: false,
    suspended: false,
    description: 'Culture principale hivernage',
  }

  it('affiche le titre "Modifier"', () => {
    render(<ActivitesForm activite={activite} families={FAMILIES} errors={{}} />)
    expect(screen.getByText(/modifier/i)).toBeInTheDocument()
  })

  it('pré-remplit le champ Nom', () => {
    render(<ActivitesForm activite={activite} families={FAMILIES} errors={{}} />)
    expect(screen.getByDisplayValue('Culture du mil')).toBeInTheDocument()
  })

  it('pré-remplit la description', () => {
    render(<ActivitesForm activite={activite} families={FAMILIES} errors={{}} />)
    expect(screen.getByDisplayValue('Culture principale hivernage')).toBeInTheDocument()
  })

  it('affiche les erreurs de validation', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{ name: 'est vide' }} />)
    expect(screen.getByText('est vide')).toBeInTheDocument()
  })

  it('le layout persistant est défini', () => {
    expect(typeof ActivitesForm.layout).toBe('function')
  })
})
