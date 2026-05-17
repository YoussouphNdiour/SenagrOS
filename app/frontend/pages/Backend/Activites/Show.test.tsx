import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ActiviteShow from './Show'

vi.mock('@inertiajs/react', () => ({ usePage: vi.fn() }))

import { usePage } from '@inertiajs/react'

const sharedProps = {
  appShell: { campaign: { name: 'Hivernage 2024' }, user: { name: 'Yoûssouph N.', initials: 'YN' } },
}

beforeEach(() => {
  vi.mocked(usePage).mockReturnValue({
    props: sharedProps,
    url: '/backend/activities/1',
  } as unknown as ReturnType<typeof usePage>)
})

const mockActivite = {
  id: 1,
  name: 'Culture du mil',
  description: 'Activité principale mil',
  family: 'plant_farming',
  nature: 'main',
  suspended: false,
  production_cycle: 'annual',
  with_supports: true,
  with_cultivation: true,
  support_variety: '',
  cultivation_variety: 'mil_tardif',
  production_started_on: '2024-06-01',
  production_stopped_on: '2024-11-30',
  productions_count: 3,
}

describe('ActiviteShow', () => {
  it('renders activity name', () => {
    render(<ActiviteShow activite={mockActivite} productions={[]} />)
    expect(screen.getByText('Culture du mil')).toBeInTheDocument()
  })

  it('shows family badge', () => {
    render(<ActiviteShow activite={mockActivite} productions={[]} />)
    expect(screen.getAllByText('Culture végétale').length).toBeGreaterThan(0)
  })

  it('shows production count', () => {
    render(<ActiviteShow activite={mockActivite} productions={[]} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows suspended badge when suspended', () => {
    render(<ActiviteShow activite={{ ...mockActivite, suspended: true }} productions={[]} />)
    expect(screen.getByText('Suspendue')).toBeInTheDocument()
  })

  it('shows empty state for no productions', () => {
    render(<ActiviteShow activite={mockActivite} productions={[]} />)
    expect(screen.getByText(/Aucune production/)).toBeInTheDocument()
  })
})
