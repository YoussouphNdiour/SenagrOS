import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CatalogueShow from './Show'
import type { CatalogueShowProps } from '../../../types/catalogue'

vi.mock('@inertiajs/react', () => ({
  router: { get: vi.fn() },
}))

const mockProduit = {
  id: 1,
  name: 'Engrais NPK',
  number: 'P001',
  produit_type: 'Matter' as const,
  population: 42.5,
  unit_name: 'kg',
  description: null,
  dead_at: null,
}

const mockMovement = {
  delta: 10,
  population: 42.5,
  started_at: '2024-03-15T00:00:00Z',
  description: 'Réception fournisseur',
}

function renderShow(overrides: Partial<CatalogueShowProps> = {}) {
  const props: CatalogueShowProps = {
    produit: mockProduit,
    movements: [mockMovement],
    ...overrides,
  }
  return render(<CatalogueShow {...props} />)
}

describe('CatalogueShow', () => {
  it('renders produit name as heading', () => {
    renderShow()
    expect(screen.getByRole('heading', { name: 'Engrais NPK' })).toBeInTheDocument()
  })

  it('renders type badge', () => {
    renderShow()
    expect(screen.getByText('Matière')).toBeInTheDocument()
  })

  it('renders population with unit', () => {
    renderShow()
    expect(
      screen.getByText((_, el) => el?.tagName === 'P' && /42\.5.*kg/.test(el.textContent ?? ''))
    ).toBeInTheDocument()
  })

  it('renders movement row with + prefix for positive delta', () => {
    renderShow()
    expect(screen.getByText('+10')).toBeInTheDocument()
  })

  it('shows empty state message when movements is empty', () => {
    renderShow({ movements: [] })
    expect(screen.getByText('Aucun mouvement enregistré')).toBeInTheDocument()
  })
})
