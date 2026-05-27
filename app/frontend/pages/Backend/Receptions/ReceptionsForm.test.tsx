// app/frontend/pages/Backend/Receptions/ReceptionsForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import ReceptionsForm from './ReceptionsForm'
import type { ReceptionsFormProps } from '../../../types/reception'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), patch: vi.fn() },
  usePage: () => ({ url: '/backend/receptions/new' }),
}))

vi.mock('../../../components/receptions/ReceptionItemsEditor', () => ({
  default: () => <div data-testid="reception-items-editor">Ajouter une ligne</div>,
}))

const purchaseOrders = [
  { id: 5, number: 'CMD-005' },
  { id: 6, number: 'CMD-006' },
]

const createProps: ReceptionsFormProps = {
  reception: { items: [] },
  purchase_orders: purchaseOrders,
  errors: {},
}

const editProps: ReceptionsFormProps = {
  reception: {
    id: 1, number: 'REC-001',
    supplier: { id: 10, full_name: 'Agro Sénégal' },
    purchase_order: { id: 5, number: 'CMD-005' },
    planned_at: '2025-06-01', given_at: '2025-06-02',
    reference_number: 'REF-42',
    state: 'draft', reconciliation_state: 'to_reconcile',
    pretax_amount: 50000, currency: 'XOF',
    items: [], canDestroy: true, invoiceable: false,
  },
  purchase_orders: purchaseOrders,
  errors: {},
}

describe('ReceptionsForm', () => {
  it('shows "Nouvelle réception" heading on create', () => {
    render(<ReceptionsForm {...createProps} />)
    expect(screen.getByText('Nouvelle réception')).toBeInTheDocument()
  })

  it('shows "Modifier" heading with number on edit', () => {
    render(<ReceptionsForm {...editProps} />)
    expect(screen.getByText(/Modifier la réception N° REC-001/)).toBeInTheDocument()
  })

  it('renders supplier input', () => {
    render(<ReceptionsForm {...createProps} />)
    expect(screen.getByPlaceholderText(/fournisseur/i)).toBeInTheDocument()
  })

  it('renders ReceptionItemsEditor', () => {
    render(<ReceptionsForm {...createProps} />)
    expect(screen.getByTestId('reception-items-editor')).toBeInTheDocument()
  })

  it('calls router.post on new form submit', async () => {
    const { router } = await import('@inertiajs/react')
    render(<ReceptionsForm {...createProps} />)
    fireEvent.submit(screen.getByRole('form'))
    expect(router.post).toHaveBeenCalledWith('/backend/receptions', expect.any(Object))
  })

  it('calls router.patch on edit form submit', async () => {
    const { router } = await import('@inertiajs/react')
    render(<ReceptionsForm {...editProps} />)
    fireEvent.submit(screen.getByRole('form'))
    expect(router.patch).toHaveBeenCalledWith('/backend/receptions/1', expect.any(Object))
  })
})
