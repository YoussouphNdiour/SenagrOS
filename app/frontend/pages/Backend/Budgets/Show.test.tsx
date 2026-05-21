import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BudgetShow from './Show'

vi.mock('@inertiajs/react', () => ({
  router: { visit: vi.fn() },
  usePage: () => ({ props: {}, url: '/backend/project_budgets/1' }),
}))

const mockBudget = {
  id: 1,
  name: 'Budget Maraîchage',
  description: 'Budget annuel pour le maraîchage',
  isacompta_analytic_code: 'MA' as string | null,
  purchase_items_count: 3,
  reception_items_count: 1,
}

function renderShow(overrides: Partial<(typeof mockBudget) & { isacompta_analytic_code: string | null }> = {}) {
  return render(<BudgetShow budget={{ ...mockBudget, ...overrides }} />)
}

describe('BudgetShow', () => {
  it('renders budget name as heading', () => {
    renderShow()
    expect(screen.getByRole('heading', { name: 'Budget Maraîchage' })).toBeInTheDocument()
  })

  it('renders description', () => {
    renderShow()
    expect(screen.getByText('Budget annuel pour le maraîchage')).toBeInTheDocument()
  })

  it('renders isacompta_analytic_code', () => {
    renderShow()
    expect(screen.getByText('MA')).toBeInTheDocument()
  })

  it('shows Manquant badge when no analytic code', () => {
    renderShow({ isacompta_analytic_code: null })
    expect(screen.getByText('Manquant')).toBeInTheDocument()
  })

  it('renders purchase_items_count and reception_items_count', () => {
    renderShow()
    expect(screen.getByText(/3 article\(s\) d'achat/)).toBeInTheDocument()
    expect(screen.getByText(/1 réception\(s\)/)).toBeInTheDocument()
  })
})
