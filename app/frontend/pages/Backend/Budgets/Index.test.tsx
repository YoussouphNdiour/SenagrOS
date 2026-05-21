import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BudgetsIndex from './Index'
import type { BudgetsIndexProps } from '../../../types/budget'

vi.mock('@inertiajs/react', () => ({
  router: { visit: vi.fn(), delete: vi.fn() },
  usePage: () => ({ props: {}, url: '/backend/project_budgets' }),
}))

const mockBudgets = [
  {
    id: 1,
    name: 'Budget Maraîchage',
    description: 'Budget annuel maraîchage',
    isacompta_analytic_code: 'MA',
    purchase_items_count: 3,
    reception_items_count: 1,
  },
  {
    id: 2,
    name: 'Budget Élevage',
    description: null,
    isacompta_analytic_code: null,
    purchase_items_count: 0,
    reception_items_count: 0,
  },
]

const defaultProps: BudgetsIndexProps = {
  budgets: mockBudgets,
  meta: { total: 2, page: 1, per_page: 25 },
}

describe('BudgetsIndex', () => {
  it('renders "Budgets projet" heading', () => {
    render(<BudgetsIndex {...defaultProps} />)
    expect(screen.getByRole('heading', { name: /Budgets projet/ })).toBeInTheDocument()
  })

  it('renders budget names as links', () => {
    render(<BudgetsIndex {...defaultProps} />)
    expect(screen.getByRole('link', { name: 'Budget Maraîchage' })).toBeInTheDocument()
  })

  it('shows Manquant badge when isacompta_analytic_code is null', () => {
    render(<BudgetsIndex {...defaultProps} />)
    expect(screen.getByText('Manquant')).toBeInTheDocument()
  })

  it('shows empty state when no budgets', () => {
    render(<BudgetsIndex budgets={[]} meta={{ total: 0, page: 1, per_page: 25 }} />)
    expect(screen.getByText(/Aucun budget projet/)).toBeInTheDocument()
  })

  it('renders Nouveau budget button', () => {
    render(<BudgetsIndex {...defaultProps} />)
    expect(screen.getByRole('button', { name: /Nouveau budget/ })).toBeInTheDocument()
  })
})
