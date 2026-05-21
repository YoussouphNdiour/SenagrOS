import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import CatalogueShow from './Show'
import type { CatalogueShowProps } from '../../../types/catalogue'

vi.mock('@inertiajs/react', () => ({
  router: { get: vi.fn(), post: vi.fn() },
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
    const select = screen.getByRole('combobox')
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
})
