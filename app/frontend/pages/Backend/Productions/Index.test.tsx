import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { usePage } from '@inertiajs/react'
import type React from 'react'
import ProductionsIndex from './Index'

vi.mock('../../../components/productions/GanttView', () => ({
  GanttView: () => <div data-testid="gantt-view-mock">Gantt</div>,
}))

vi.mock('../../../components/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

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

  it('shows table view by default', () => {
    render(<ProductionsIndex productions={PRODUCTIONS} meta={{ total: 1, page: 1, per_page: 50 }} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByTestId('gantt-view-mock')).toBeNull()
  })

  it('switches to gantt view when Gantt button clicked', async () => {
    const user = userEvent.setup()
    render(<ProductionsIndex productions={PRODUCTIONS} meta={{ total: 1, page: 1, per_page: 50 }} />)
    await user.click(screen.getByRole('button', { name: 'Vue Gantt' }))
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByTestId('gantt-view-mock')).toBeInTheDocument()
  })
})
