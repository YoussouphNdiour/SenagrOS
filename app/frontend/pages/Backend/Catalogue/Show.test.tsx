import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import CatalogueShow from './Show'
import type { CatalogueShowProps } from '../../../types/catalogue'

vi.mock('@inertiajs/react', () => ({
  router: { get: vi.fn(), post: vi.fn() },
}))

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ position }: { position: [number, number] }) => <div data-testid="marker" data-position={JSON.stringify(position)} />,
}))

vi.mock('leaflet/dist/leaflet.css', () => ({}))
vi.mock('leaflet/dist/images/marker-icon.png', () => ({ default: '' }))
vi.mock('leaflet/dist/images/marker-icon-2x.png', () => ({ default: '' }))
vi.mock('leaflet/dist/images/marker-shadow.png', () => ({ default: '' }))

vi.mock('leaflet', () => ({
  default: {
    Icon: { Default: { mergeOptions: vi.fn(), prototype: {} } },
    icon: () => ({}),
  },
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
  born_at: null,
  geolocation: null,
  sex: null,
  identification_number: null,
  filiation_status: null,
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
    movement_meta: { total: 1, page: 1, per_page: 20 },
    movement_filter: null,
    interventions: [],
    issues: [],
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

  it('renders movement form', () => {
    renderShow()
    expect(screen.getByRole('form', { name: 'Formulaire mouvement' })).toBeInTheDocument()
  })

  it('renders delta number input', () => {
    renderShow()
    expect(screen.getByPlaceholderText(/ex: 10 ou -5/)).toBeInTheDocument()
  })

  it('renders mouvement type select with Achat as default', () => {
    renderShow()
    const select = screen.getByRole('combobox', { name: 'Type de mouvement' })
    expect(select).toBeInTheDocument()
    expect((select as HTMLSelectElement).value).toBe('purchase')
  })

  it('calls router.post on form submit', async () => {
    const { router } = await import('@inertiajs/react')
    renderShow()
    const deltaInput = screen.getByPlaceholderText(/ex: 10 ou -5/)
    await userEvent.type(deltaInput, '5')
    await userEvent.click(screen.getByRole('button', { name: /Enregistrer le mouvement/ }))
    expect(router.post).toHaveBeenCalledWith(
      '/backend/products/1/movements',
      expect.objectContaining({ delta: '5' }),
      expect.any(Object)
    )
  })

  it('shows age in header for Animal type when born_at is set', () => {
    renderShow({
      produit: { ...mockProduit, produit_type: 'Animal' as const, born_at: '2023-01-15T00:00:00Z' },
    })
    expect(screen.getByText(/Âge/)).toBeInTheDocument()
  })

  it('does not show Âge label for Matter type even with born_at set', () => {
    renderShow({
      produit: { ...mockProduit, produit_type: 'Matter' as const, born_at: '2023-01-15T00:00:00Z' },
    })
    expect(screen.queryByText(/Âge/)).not.toBeInTheDocument()
  })

  it('renders movement filter select', () => {
    renderShow()
    expect(screen.getByRole('combobox', { name: 'Filtrer les mouvements par type' })).toBeInTheDocument()
  })

  it('shows pagination when total exceeds per_page', () => {
    renderShow({ movement_meta: { total: 25, page: 1, per_page: 20 } })
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Précédent' })).toBeInTheDocument()
  })

  it('hides pagination when total fits in one page', () => {
    renderShow({ movement_meta: { total: 5, page: 1, per_page: 20 } })
    expect(screen.queryByRole('button', { name: 'Suivant' })).not.toBeInTheDocument()
  })

  it('shows empty interventions message when interventions is empty', () => {
    renderShow()
    expect(screen.getByText(/Aucune intervention/)).toBeInTheDocument()
  })

  it('renders intervention row when interventions are present', () => {
    renderShow({
      interventions: [{ id: 1, name: 'Traitement herbicide', started_at: '2024-03-01T00:00:00Z', nature: 'record', parameter_type: 'input' }],
    })
    expect(screen.getByText('Traitement herbicide')).toBeInTheDocument()
  })

  it('shows empty issues message when issues is empty', () => {
    renderShow()
    expect(screen.getByText(/Aucun problème/)).toBeInTheDocument()
  })

  it('renders issue row when issues are present', () => {
    renderShow({
      issues: [{ id: 1, name: 'Attaque criquet', nature: 'pest', observed_at: '2024-04-10', state: 'opened', gravity: 4 }],
    })
    expect(screen.getByText('Attaque criquet')).toBeInTheDocument()
  })

  it('renders "Modifier" link pointing to edit URL', () => {
    renderShow()
    const link = screen.getByRole('link', { name: /Modifier/ })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/backend/products/1/edit')
  })

  it('renders "Supprimer" link with data-method delete', () => {
    renderShow()
    const link = screen.getByRole('link', { name: /Supprimer/ })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('data-method', 'delete')
  })

  it('shows Localisation section when produit has geolocation', () => {
    renderShow({
      produit: { ...mockProduit, geolocation: { lat: 14.7167, lng: -17.4677 } },
    })
    expect(screen.getByText('Localisation')).toBeInTheDocument()
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('hides Localisation section when produit has no geolocation', () => {
    renderShow({ produit: { ...mockProduit, geolocation: null } })
    expect(screen.queryByText('Localisation')).not.toBeInTheDocument()
  })

  it('shows identification number for Animal type when set', () => {
    renderShow({
      produit: { ...mockProduit, produit_type: 'Animal' as const, identification_number: 'FR12345678' },
    })
    expect(screen.getByText('FR12345678')).toBeInTheDocument()
  })

  it('shows sex label "Mâle" for Animal type when sex is male', () => {
    renderShow({
      produit: { ...mockProduit, produit_type: 'Animal' as const, sex: 'male' },
    })
    expect(screen.getByText('Mâle')).toBeInTheDocument()
  })

  it('hides animal fields for non-Animal type', () => {
    renderShow({
      produit: { ...mockProduit, produit_type: 'Matter' as const, identification_number: 'FR12345678' },
    })
    expect(screen.queryByText('FR12345678')).not.toBeInTheDocument()
  })
})
