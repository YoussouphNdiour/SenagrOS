import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { usePage } from '@inertiajs/react'
import ProductionsIndex from './Index'

const PRODUCTIONS = [
  {
    id: 1,
    name: 'Maïs Nord 2024',
    started_on: '2024-06-01',
    stopped_on: '2024-11-15',
    state: 'opened',
    activity:        { id: 1, name: 'Maïs', family: 'cereal' },
    cultivable_zone: { id: 1, name: 'Champ Nord' },
    campaign:        { id: 1, name: 'Hivernage 2024', harvest_year: 2024 },
  },
]

describe('ProductionsIndex', () => {
  beforeEach(() => {
    vi.mocked(usePage).mockReturnValue({
      props: { appShell: { farm: { name: 'Ferme' }, campaign: null, user: { name: 'Test', initials: 'T' } }, errors: {} },
      url: '/backend/activity_productions',
      component: 'Backend/Productions/Index',
      version: '1',
      encryptHistory: false,
      clearHistory: false,
      scrollRegions: [],
      rememberedState: {},
    } as ReturnType<typeof usePage>)
  })

  it('affiche le titre', () => {
    render(<ProductionsIndex productions={PRODUCTIONS} meta={{ total: 1, page: 1, per_page: 25 }} />)
    expect(screen.getByText('Productions')).toBeInTheDocument()
  })

  it('affiche le nom de la production', () => {
    render(<ProductionsIndex productions={PRODUCTIONS} meta={{ total: 1, page: 1, per_page: 25 }} />)
    expect(screen.getByText('Maïs Nord 2024')).toBeInTheDocument()
  })

  it('affiche la zone cultivable', () => {
    render(<ProductionsIndex productions={PRODUCTIONS} meta={{ total: 1, page: 1, per_page: 25 }} />)
    expect(screen.getByText('Champ Nord')).toBeInTheDocument()
  })

  it('affiche la campagne', () => {
    render(<ProductionsIndex productions={PRODUCTIONS} meta={{ total: 1, page: 1, per_page: 25 }} />)
    expect(screen.getByText('Hivernage 2024')).toBeInTheDocument()
  })

  it('affiche "Aucune production" si vide', () => {
    render(<ProductionsIndex productions={[]} meta={{ total: 0, page: 1, per_page: 25 }} />)
    expect(screen.getByText(/aucune production/i)).toBeInTheDocument()
  })
})
