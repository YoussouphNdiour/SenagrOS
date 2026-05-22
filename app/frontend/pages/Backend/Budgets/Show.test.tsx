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

function renderShow(overrides: Partial<typeof mockBudget> = {}) {
  return render(
    <BudgetShow
      budget={{ ...mockBudget, ...overrides }}
      purchase_lines={[]}
      total_pretax_amount={0}
      reception_lines={[]}
    />
  )
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

  it('shows empty state when no purchase lines', () => {
    render(<BudgetShow budget={mockBudget} purchase_lines={[]} total_pretax_amount={0} reception_lines={[]} />)
    expect(screen.getByText(/Aucune ligne d'achat/)).toBeInTheDocument()
  })

  it('renders purchase lines table when lines are present', () => {
    const lines = [
      { id: 1, label: 'Engrais NPK', quantity: 50, pretax_amount: 25000, currency: 'XOF', purchase_number: 'BC-001' },
    ]
    render(<BudgetShow budget={mockBudget} purchase_lines={lines} total_pretax_amount={25000} reception_lines={[]} />)
    expect(screen.getByText('Engrais NPK')).toBeInTheDocument()
    expect(screen.getByText('BC-001')).toBeInTheDocument()
  })

  it('renders total pretax amount row', () => {
    const lines = [
      { id: 1, label: 'Semences', quantity: 10, pretax_amount: 15000, currency: 'XOF', purchase_number: 'BC-002' },
    ]
    render(<BudgetShow budget={mockBudget} purchase_lines={lines} total_pretax_amount={15000} reception_lines={[]} />)
    expect(screen.getByText('Total HT')).toBeInTheDocument()
  })

  it('renders Réceptions heading', () => {
    render(<BudgetShow budget={mockBudget} purchase_lines={[]} total_pretax_amount={0} reception_lines={[]} />)
    expect(screen.getByText(/Réceptions/)).toBeInTheDocument()
  })

  it('shows empty reception state when reception_lines is empty', () => {
    render(<BudgetShow budget={mockBudget} purchase_lines={[]} total_pretax_amount={0} reception_lines={[]} />)
    expect(screen.getByText(/Aucune réception/)).toBeInTheDocument()
  })

  it('renders reception line when reception_lines is present', () => {
    const lines = [{ id: 1, product_name: 'Semences mil', quantity: 25, parcel_number: 'REC-001' }]
    render(<BudgetShow budget={mockBudget} purchase_lines={[]} total_pretax_amount={0} reception_lines={lines} />)
    expect(screen.getByText('Semences mil')).toBeInTheDocument()
    expect(screen.getByText('REC-001')).toBeInTheDocument()
  })
})
