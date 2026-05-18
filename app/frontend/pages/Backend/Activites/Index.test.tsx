import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { usePage } from '@inertiajs/react'
import ActivitesIndex from './Index'

vi.mocked(usePage).mockReturnValue({
  props: { appShell: { farm: { name: 'Ferme Test' }, campaign: null, user: { name: 'Test User', initials: 'TU' } }, errors: {} },
  url: '/backend/activities',
  component: 'Backend/Activites/Index',
  version: '1',
  encryptHistory: false,
  clearHistory: false,
  scrollRegions: [],
  rememberedState: {},
} as ReturnType<typeof usePage>)

const ACTIVITES = [
  { id: 1, name: 'Maïs culture',    family: 'plant_farming',  nature: 'main',       suspended: false },
  { id: 2, name: 'Élevage bovin',   family: 'animal_farming', nature: 'auxiliary',  suspended: true  },
  { id: 3, name: 'Vigne parcelle',  family: 'vine_farming',   nature: 'standalone', suspended: false },
]

describe('ActivitesIndex', () => {
  it('affiche le titre Activités', () => {
    render(<ActivitesIndex activites={ACTIVITES} meta={{ total: 3, page: 1, per_page: 25 }} />)
    expect(screen.getByText('Activités')).toBeInTheDocument()
  })

  it('affiche le sous-titre avec le total', () => {
    render(<ActivitesIndex activites={ACTIVITES} meta={{ total: 3, page: 1, per_page: 25 }} />)
    expect(screen.getByText(/3 activités/i)).toBeInTheDocument()
  })

  it('affiche les noms des activités', () => {
    render(<ActivitesIndex activites={ACTIVITES} meta={{ total: 3, page: 1, per_page: 25 }} />)
    expect(screen.getByText('Maïs culture')).toBeInTheDocument()
    expect(screen.getByText('Élevage bovin')).toBeInTheDocument()
    expect(screen.getByText('Vigne parcelle')).toBeInTheDocument()
  })

  it('affiche le badge "Culture" pour plant_farming', () => {
    render(<ActivitesIndex activites={ACTIVITES} meta={{ total: 3, page: 1, per_page: 25 }} />)
    expect(screen.getByText('Culture')).toBeInTheDocument()
  })

  it('affiche le badge "Élevage" pour animal_farming', () => {
    render(<ActivitesIndex activites={ACTIVITES} meta={{ total: 3, page: 1, per_page: 25 }} />)
    expect(screen.getByText('Élevage')).toBeInTheDocument()
  })

  it('affiche le badge "Viticulture" pour vine_farming', () => {
    render(<ActivitesIndex activites={ACTIVITES} meta={{ total: 3, page: 1, per_page: 25 }} />)
    expect(screen.getByText('Viticulture')).toBeInTheDocument()
  })

  it('affiche "Suspendue" pour une activité suspendue', () => {
    render(<ActivitesIndex activites={ACTIVITES} meta={{ total: 3, page: 1, per_page: 25 }} />)
    expect(screen.getByText('Suspendue')).toBeInTheDocument()
  })

  it('affiche "Active" pour une activité non suspendue', () => {
    render(<ActivitesIndex activites={ACTIVITES} meta={{ total: 3, page: 1, per_page: 25 }} />)
    const badges = screen.getAllByText('Active')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('affiche les labels de nature corrects', () => {
    render(<ActivitesIndex activites={ACTIVITES} meta={{ total: 3, page: 1, per_page: 25 }} />)
    expect(screen.getByText('Principale')).toBeInTheDocument()
    expect(screen.getByText('Auxiliaire')).toBeInTheDocument()
    expect(screen.getByText('Autonome')).toBeInTheDocument()
  })

  it('le layout persistant est défini', () => {
    expect(typeof ActivitesIndex.layout).toBe('function')
  })
})
