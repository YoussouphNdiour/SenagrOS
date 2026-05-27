import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BudgetForm from './Form'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), patch: vi.fn(), visit: vi.fn() },
  usePage: () => ({ props: {}, url: '/backend/project_budgets/new' }),
}))

const emptyBudget = {
  id: 0,
  name: '',
  description: null,
  isacompta_analytic_code: null,
  purchase_items_count: 0,
  reception_items_count: 0,
}

const existingBudget = {
  id: 1,
  name: 'Budget Maraîchage',
  description: 'Desc',
  isacompta_analytic_code: 'MA',
  purchase_items_count: 0,
  reception_items_count: 0,
}

describe('BudgetForm', () => {
  it('renders "Nouveau budget" heading in new mode', () => {
    render(<BudgetForm budget={emptyBudget} errors={{}} mode="new" />)
    expect(screen.getByRole('heading', { name: 'Nouveau budget' })).toBeInTheDocument()
  })

  it('renders "Modifier le budget" heading in edit mode', () => {
    render(<BudgetForm budget={existingBudget} errors={{}} mode="edit" />)
    expect(screen.getByRole('heading', { name: 'Modifier le budget' })).toBeInTheDocument()
  })

  it('renders name input as required', () => {
    render(<BudgetForm budget={emptyBudget} errors={{}} mode="new" />)
    const input = screen.getByLabelText(/Nom/)
    expect(input).toBeRequired()
  })

  it('renders analytic code input with maxLength 2', () => {
    render(<BudgetForm budget={emptyBudget} errors={{}} mode="new" />)
    const input = screen.getByPlaceholderText('ex: MA')
    expect(input).toHaveAttribute('maxLength', '2')
  })

  it('shows server error under name field', () => {
    render(<BudgetForm budget={emptyBudget} errors={{ name: ['est obligatoire'] }} mode="new" />)
    expect(screen.getAllByText('est obligatoire').length).toBeGreaterThan(0)
  })
})
