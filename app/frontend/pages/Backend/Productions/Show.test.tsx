import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProductionShow from './Show'

vi.mock('@inertiajs/react', () => ({ usePage: vi.fn() }))

import { usePage } from '@inertiajs/react'

const sharedProps = {
  appShell: { campaign: { name: 'Hivernage 2024' }, user: { name: 'Yoûssouph N.', initials: 'YN' } },
}

beforeEach(() => {
  vi.mocked(usePage).mockReturnValue({
    props: sharedProps,
    url: '/backend/activity_productions/1',
  } as unknown as ReturnType<typeof usePage>)
})

const mockProduction = {
  id: 1,
  name: 'Champ Nord - Culture du mil 2024',
  custom_name: '',
  state: 'opened',
  started_on: '2024-06-01',
  stopped_on: null,
  usage: '',
  size_value: 12.5,
  size_indicator_name: 'net_surface_area',
  size_unit_name: 'ha',
  irrigated: false,
  nitrate_fixing: true,
  rank_number: 1,
  activity_id: 1,
  activity_name: 'Culture du mil',
  activity_family: 'plant_farming',
  cultivable_zone_id: 1,
  cultivable_zone_name: 'Champ Nord - Louga',
  campaign_id: 1,
  campaign_name: 'Hivernage 2024',
}

describe('ProductionShow', () => {
  it('renders production name', () => {
    render(<ProductionShow production={mockProduction} />)
    expect(screen.getByText('Champ Nord - Culture du mil 2024')).toBeInTheDocument()
  })

  it('shows state badge', () => {
    render(<ProductionShow production={mockProduction} />)
    expect(screen.getByText('Ouverte')).toBeInTheDocument()
  })

  it('shows activity family badge', () => {
    render(<ProductionShow production={mockProduction} />)
    expect(screen.getByText('Culture')).toBeInTheDocument()
  })

  it('shows size value with unit', () => {
    render(<ProductionShow production={mockProduction} />)
    expect(screen.getByText('12.5 ha')).toBeInTheDocument()
  })

  it('shows nitrate fixing yes', () => {
    render(<ProductionShow production={mockProduction} />)
    const allOui = screen.getAllByText('Oui')
    expect(allOui.length).toBeGreaterThan(0)
  })
})
