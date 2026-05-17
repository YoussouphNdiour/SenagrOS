import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { usePage } from '@inertiajs/react'
import CampagnesIndex from './Index'

const CAMPAGNES = [
  { id: 1, name: 'Hivernage 2024', harvest_year: 2024, closed: false },
  { id: 2, name: 'Hivernage 2023', harvest_year: 2023, closed: true },
]

describe('CampagnesIndex', () => {
  beforeEach(() => {
    vi.mocked(usePage).mockReturnValue({
      props: { appShell: { farm: { name: 'Ferme' }, campaign: null, user: { name: 'Test', initials: 'T' } }, errors: {} },
      url: '/backend/campaigns',
      component: 'Backend/Campagnes/Index',
      version: '1',
      encryptHistory: false,
      clearHistory: false,
      scrollRegions: [],
      rememberedState: {},
    } as ReturnType<typeof usePage>)
  })

  it('affiche le titre Campagnes', () => {
    render(<CampagnesIndex campagnes={CAMPAGNES} meta={{ total: 2 }} />)
    expect(screen.getByText('Campagnes')).toBeInTheDocument()
  })

  it('affiche le nombre de campagnes', () => {
    render(<CampagnesIndex campagnes={CAMPAGNES} meta={{ total: 2 }} />)
    expect(screen.getByText('2 campagnes')).toBeInTheDocument()
  })

  it('affiche les années de récolte', () => {
    render(<CampagnesIndex campagnes={CAMPAGNES} meta={{ total: 2 }} />)
    expect(screen.getByText('2024')).toBeInTheDocument()
    expect(screen.getByText('2023')).toBeInTheDocument()
  })

  it('affiche le badge "En cours" pour une campagne ouverte', () => {
    render(<CampagnesIndex campagnes={CAMPAGNES} meta={{ total: 2 }} />)
    expect(screen.getByText('En cours')).toBeInTheDocument()
  })

  it('affiche le badge "Clôturée" pour une campagne fermée', () => {
    render(<CampagnesIndex campagnes={CAMPAGNES} meta={{ total: 2 }} />)
    expect(screen.getByText('Clôturée')).toBeInTheDocument()
  })

  it('affiche "Aucune campagne" si vide', () => {
    render(<CampagnesIndex campagnes={[]} meta={{ total: 0 }} />)
    expect(screen.getByText(/aucune campagne/i)).toBeInTheDocument()
  })

  it('a le layout AppShell défini', () => {
    expect(typeof CampagnesIndex.layout).toBe('function')
  })
})
