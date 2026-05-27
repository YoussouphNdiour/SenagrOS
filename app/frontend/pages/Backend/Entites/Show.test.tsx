import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import EntiteShow from './Show'

vi.mock('@inertiajs/react', () => ({ usePage: vi.fn(), router: { delete: vi.fn() } }))

import { usePage } from '@inertiajs/react'

const sharedProps = {
  appShell: { campaign: { name: 'Hivernage 2024' }, user: { name: 'Yoûssouph N.', initials: 'YN' } },
}

beforeEach(() => {
  vi.mocked(usePage).mockReturnValue({ props: sharedProps, url: '/backend/entities/1' } as unknown as ReturnType<typeof usePage>)
})

const mockEntite = {
  id: 1,
  nature: 'organization',
  full_name: 'GIE Ndiaye Agri',
  last_name: 'Ndiaye Agri',
  first_name: '',
  number: 'ENT001',
  title: '',
  active: true,
  born_at: null,
  dead_at: null,
  client: true,
  supplier: false,
  transporter: false,
  prospect: false,
  vat_subjected: true,
  description: '',
  language: 'fra',
  country: 'SN',
  currency: 'XOF',
  vat_number: 'SN123456',
  siret_number: '',
}

describe('EntiteShow', () => {
  it('renders entity name', () => {
    render(<EntiteShow entite={mockEntite} canDestroy={true} />)
    expect(screen.getByText('GIE Ndiaye Agri')).toBeInTheDocument()
  })

  it('shows Organisation badge for organization', () => {
    render(<EntiteShow entite={mockEntite} canDestroy={true} />)
    expect(screen.getByText('Organisation')).toBeInTheDocument()
  })

  it('shows Client role badge', () => {
    render(<EntiteShow entite={mockEntite} canDestroy={true} />)
    expect(screen.getByText('Client')).toBeInTheDocument()
  })

  it('shows Contact badge for contact nature', () => {
    render(<EntiteShow entite={{ ...mockEntite, nature: 'contact', full_name: 'John Doe' }} canDestroy={true} />)
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('shows Inactif badge when not active', () => {
    render(<EntiteShow entite={{ ...mockEntite, active: false }} canDestroy={true} />)
    expect(screen.getByText('Inactif')).toBeInTheDocument()
  })

  it('shows VAT number', () => {
    render(<EntiteShow entite={mockEntite} canDestroy={true} />)
    expect(screen.getByText('SN123456')).toBeInTheDocument()
  })
})
