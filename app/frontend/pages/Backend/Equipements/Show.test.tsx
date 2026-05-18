import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import EquipementShow from './Show'

vi.mock('@inertiajs/react', () => ({ usePage: vi.fn() }))

import { usePage } from '@inertiajs/react'

const sharedProps = {
  appShell: { campaign: { name: 'Hivernage 2024' }, user: { name: 'Yoûssouph N.', initials: 'YN' } },
}

beforeEach(() => {
  vi.mocked(usePage).mockReturnValue({ props: sharedProps, url: '/backend/equipments/1' } as unknown as ReturnType<typeof usePage>)
})

const mockEquipement = {
  id: 1,
  name: 'Tracteur John Deere 5055E',
  work_number: 'EQ001',
  number: '1',
  identification_number: 'JD5055E-2020',
  description: 'Tracteur principal de la ferme',
  born_at: '2020-01-15T00:00:00Z',
  dead_at: null,
  variant_name: 'Tracteur agricole',
  type: 'Equipment',
}

const emptySubsections = {
  interventions: [],
  maintenances: [],
  links: [],
}

describe('EquipementShow', () => {
  it('renders equipment name in heading', () => {
    render(<EquipementShow equipement={mockEquipement} {...emptySubsections} />)
    expect(screen.getByRole('heading', { name: 'Tracteur John Deere 5055E' })).toBeInTheDocument()
  })

  it('shows work number badge', () => {
    render(<EquipementShow equipement={mockEquipement} {...emptySubsections} />)
    expect(screen.getByText('N° EQ001')).toBeInTheDocument()
  })

  it('shows Actif badge when no dead_at', () => {
    render(<EquipementShow equipement={mockEquipement} {...emptySubsections} />)
    expect(screen.getByText('Actif')).toBeInTheDocument()
  })

  it('shows retired badge when has dead_at', () => {
    render(<EquipementShow equipement={{ ...mockEquipement, dead_at: '2023-12-01T00:00:00Z' }} {...emptySubsections} />)
    // "Retiré du service" appears as both the status badge and the lifecycle dt label
    expect(screen.getAllByText('Retiré du service').length).toBeGreaterThanOrEqual(1)
  })

  it('shows variant name', () => {
    render(<EquipementShow equipement={mockEquipement} {...emptySubsections} />)
    expect(screen.getByText('Tracteur agricole')).toBeInTheDocument()
  })

  it('shows identification number', () => {
    render(<EquipementShow equipement={mockEquipement} {...emptySubsections} />)
    expect(screen.getByText('JD5055E-2020')).toBeInTheDocument()
  })
})
