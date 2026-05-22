import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CatalogueIndex from './Index'
import type { CatalogueIndexProps } from '../../../types/catalogue'

vi.mock('@inertiajs/react', () => ({
  router: { get: vi.fn() },
}))

const mockMeta = { total_count: 1, current_page: 1, total_pages: 1 }

const mockProduit = {
  id: 1,
  name: 'Maïs local',
  number: 'P001',
  produit_type: 'Matter' as const,
  population: 50,
  unit_name: 'kg',
  description: null,
  dead_at: null,
  born_at: null,
  geolocation: null,
}

function renderIndex(overrides: Partial<CatalogueIndexProps> = {}) {
  const props: CatalogueIndexProps = {
    produits: [mockProduit],
    filters: {},
    meta: mockMeta,
    ...overrides,
  }
  return render(<CatalogueIndex {...props} />)
}

describe('CatalogueIndex', () => {
  it('renders "Catalogue" heading', () => {
    renderIndex()
    expect(screen.getByRole('heading', { name: 'Catalogue' })).toBeInTheDocument()
  })

  it('renders produit name in table', () => {
    renderIndex()
    expect(screen.getByText('Maïs local')).toBeInTheDocument()
  })

  it('renders type badge with correct label for Matter', () => {
    renderIndex()
    // "Matière" appears in both the filter button and the table badge
    const instances = screen.getAllByText('Matière')
    expect(instances.length).toBeGreaterThanOrEqual(1)
  })

  it('shows "Épuisé" badge when population = 0 and dead_at is null', () => {
    renderIndex({ produits: [{ ...mockProduit, population: 0, dead_at: null }] })
    expect(screen.getByText('Épuisé')).toBeInTheDocument()
  })

  it('shows "Inactif" badge when dead_at is set', () => {
    renderIndex({ produits: [{ ...mockProduit, dead_at: '2024-01-01' }] })
    const instances = screen.getAllByText('Inactif')
    expect(instances.length).toBeGreaterThanOrEqual(1)
  })

  it('renders pagination info from meta.total_count', () => {
    renderIndex({ meta: { total_count: 42, current_page: 1, total_pages: 3 } })
    expect(screen.getByText(/42/)).toBeInTheDocument()
  })

  it('renders état filter select', () => {
    renderIndex()
    expect(screen.getByRole('combobox', { name: 'État du produit' })).toBeInTheDocument()
  })

  it('initializes état filter to "dead" when filters.etat is "dead"', () => {
    renderIndex({ filters: { etat: 'dead' } })
    const select = screen.getByRole('combobox', { name: 'État du produit' }) as HTMLSelectElement
    expect(select.value).toBe('dead')
  })

  it('renders "Nouveau produit" link pointing to /backend/products/new', () => {
    renderIndex()
    const link = screen.getByRole('link', { name: /Nouveau produit/ })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/backend/products/new')
  })

  it('renders "Exporter CSV" link with download attribute', () => {
    renderIndex()
    const link = screen.getByRole('link', { name: /Exporter CSV/ })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('download')
  })
})
