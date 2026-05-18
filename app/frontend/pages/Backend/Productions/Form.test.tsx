import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { usePage } from '@inertiajs/react'
import ProductionsForm from './Form'

beforeEach(() => {
  vi.mocked(usePage).mockReturnValue({
    props: {
      appShell: { farm: { name: 'Ferme Test' }, campaign: null, user: { name: 'Test', initials: 'T' } },
    },
    url: '/backend/activity_productions/new',
    component: 'Backend/Productions/Form',
    version: '1',
    encryptHistory: false,
    clearHistory: false,
  } as unknown as ReturnType<typeof usePage>)
})

const ACTIVITIES = [{ id: 1, name: 'Culture du mil' }, { id: 2, name: 'Maraîchage' }]
const CAMPAIGNS  = [{ id: 10, name: 'Hivernage 2024' }, { id: 11, name: 'Hivernage 2023' }]
const ZONES      = [{ id: 100, name: 'Parcelle Nord' }]

describe('ProductionsForm — création', () => {
  it('affiche le titre "Nouvelle production"', () => {
    render(<ProductionsForm production={null} activities={ACTIVITIES} campaigns={CAMPAIGNS} cultivable_zones={ZONES} errors={{}} />)
    expect(screen.getByText(/nouvelle production/i)).toBeInTheDocument()
  })

  it('affiche le select Activité', () => {
    render(<ProductionsForm production={null} activities={ACTIVITIES} campaigns={CAMPAIGNS} cultivable_zones={ZONES} errors={{}} />)
    expect(screen.getByLabelText(/activité/i)).toBeInTheDocument()
  })

  it('affiche le select Campagne', () => {
    render(<ProductionsForm production={null} activities={ACTIVITIES} campaigns={CAMPAIGNS} cultivable_zones={ZONES} errors={{}} />)
    expect(screen.getByLabelText(/campagne/i)).toBeInTheDocument()
  })

  it('affiche le select Parcelle', () => {
    render(<ProductionsForm production={null} activities={ACTIVITIES} campaigns={CAMPAIGNS} cultivable_zones={ZONES} errors={{}} />)
    expect(screen.getByLabelText(/parcelle/i)).toBeInTheDocument()
  })

  it('affiche le select État', () => {
    render(<ProductionsForm production={null} activities={ACTIVITIES} campaigns={CAMPAIGNS} cultivable_zones={ZONES} errors={{}} />)
    expect(screen.getByLabelText(/état/i)).toBeInTheDocument()
  })

  it('affiche les checkboxes Irriguée et Fixation azote', () => {
    render(<ProductionsForm production={null} activities={ACTIVITIES} campaigns={CAMPAIGNS} cultivable_zones={ZONES} errors={{}} />)
    expect(screen.getByLabelText(/irriguée/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fixation/i)).toBeInTheDocument()
  })

  it('affiche un bouton de soumission', () => {
    render(<ProductionsForm production={null} activities={ACTIVITIES} campaigns={CAMPAIGNS} cultivable_zones={ZONES} errors={{}} />)
    expect(screen.getByRole('button', { name: /créer|enregistrer/i })).toBeInTheDocument()
  })

  it('affiche un lien Annuler', () => {
    render(<ProductionsForm production={null} activities={ACTIVITIES} campaigns={CAMPAIGNS} cultivable_zones={ZONES} errors={{}} />)
    expect(screen.getByRole('link', { name: /annuler/i })).toBeInTheDocument()
  })
})

describe('ProductionsForm — édition', () => {
  const production = {
    id: 5,
    activity_id: 1,
    campaign_id: 10,
    cultivable_zone_id: 100,
    started_on: '2024-06-01',
    stopped_on: null,
    irrigated: true,
    nitrate_fixing: false,
    state: 'opened',
  }

  it('affiche le titre "Modifier"', () => {
    render(<ProductionsForm production={production} activities={ACTIVITIES} campaigns={CAMPAIGNS} cultivable_zones={ZONES} errors={{}} />)
    expect(screen.getByText(/modifier/i)).toBeInTheDocument()
  })

  it('affiche les erreurs de validation', () => {
    render(<ProductionsForm production={null} activities={ACTIVITIES} campaigns={CAMPAIGNS} cultivable_zones={ZONES} errors={{ activity_id: 'requis' }} />)
    expect(screen.getByText('requis')).toBeInTheDocument()
  })

  it('le layout persistant est défini', () => {
    expect(typeof ProductionsForm.layout).toBe('function')
  })
})
