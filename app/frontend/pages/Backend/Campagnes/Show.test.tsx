import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import CampagneShow from './Show'

vi.mock('@inertiajs/react', () => ({ usePage: vi.fn() }))

import { usePage } from '@inertiajs/react'

const sharedProps = {
  appShell: {
    campaign: { name: 'Hivernage 2024' },
    user: { name: 'Yoûssouph N.', initials: 'YN' },
  },
  errors: {},
}

beforeEach(() => {
  vi.mocked(usePage).mockReturnValue({
    props: sharedProps,
    url: '/backend/campaigns/1',
    component: 'Backend/Campagnes/Show',
    version: '1',
    encryptHistory: false,
    clearHistory: false,
    scrollRegions: [],
    rememberedState: {},
  } as ReturnType<typeof usePage>)
})

const mockCampagne = {
  id: 1,
  name: 'Campagne 2024',
  description: '',
  harvest_year: 2024,
  closed: false,
  closed_at: null,
  created_at: '2024-01-01T00:00:00Z',
}

const mockProductions = [
  {
    id: 1,
    name: 'Production mil',
    state: 'opened',
    started_on: '2024-06-01',
    stopped_on: null,
    activity_name: 'Mil',
    cultivable_zone_name: 'Champ Nord',
  },
]

describe('CampagneShow', () => {
  it('renders campaign name', () => {
    render(<CampagneShow campagne={mockCampagne} productions={[]} />)
    expect(screen.getByText('Campagne 2024')).toBeInTheDocument()
    expect(screen.getByText('En cours')).toBeInTheDocument()
  })

  it('shows harvest year', () => {
    render(<CampagneShow campagne={mockCampagne} productions={[]} />)
    expect(screen.getByText('2024')).toBeInTheDocument()
  })

  it('renders productions table', () => {
    render(<CampagneShow campagne={mockCampagne} productions={mockProductions} />)
    expect(screen.getByText('Production mil')).toBeInTheDocument()
    expect(screen.getByText('Ouverte')).toBeInTheDocument()
  })

  it('shows empty state when no productions', () => {
    render(<CampagneShow campagne={mockCampagne} productions={[]} />)
    expect(screen.getByText(/Aucune production/)).toBeInTheDocument()
  })

  it('shows closed badge for closed campaign', () => {
    render(
      <CampagneShow
        campagne={{ ...mockCampagne, closed: true, closed_at: '2024-12-01T00:00:00Z' }}
        productions={[]}
      />
    )
    expect(screen.getByText('Clôturée')).toBeInTheDocument()
  })
})
