import { render, screen, fireEvent } from '@testing-library/react'
import FacturesForm from './FacturesForm'
import type { FacturesFormProps } from '../../../types/achat'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), patch: vi.fn() },
  usePage: () => ({ url: '/backend/purchase_invoices/new' }),
}))

vi.mock('../../../components/achats/AchatItemsEditor', () => ({
  default: () => <div data-testid="achat-items-editor">AchatItemsEditor</div>,
}))

const natures = [{ id: 1, name: 'Achat standard', currency: 'XOF', payment_delay: '30 jours' }]
const taxes = [{ id: 1, name: 'TVA 18%', short_label: '18%', amount: 0.18 }]

const newProps: FacturesFormProps = {
  facture: { currency: 'XOF', items: [] },
  natures,
  taxes,
  errors: {},
}

const editProps: FacturesFormProps = {
  facture: {
    id: 1, number: 'FAC-001', reference_number: 'RF-100', invoiced_at: '2025-06-15',
    supplier: { id: 10, full_name: 'Agro Sénégal' }, nature_name: null,
    pretax_amount: 0, amount: 0, currency: 'XOF',
    reconciliation_state: 'to_reconcile', unpaid: true,
    description: null, payment_delay: '30 jours', responsible_name: null,
    items: [], destroyable: false, updatable: true,
  },
  natures,
  taxes,
  errors: {},
}

describe('FacturesForm', () => {
  it('renders "Nouvelle facture" heading for new form', () => {
    render(<FacturesForm {...newProps} />)
    expect(screen.getByText('Nouvelle facture')).toBeInTheDocument()
  })

  it('renders "Modifier" heading with number for edit form', () => {
    render(<FacturesForm {...editProps} />)
    expect(screen.getByText(/Modifier la facture/)).toBeInTheDocument()
    expect(screen.getByText(/FAC-001/)).toBeInTheDocument()
  })

  it('renders supplier input', () => {
    render(<FacturesForm {...newProps} />)
    expect(screen.getByPlaceholderText(/fournisseur/i)).toBeInTheDocument()
  })

  it('renders AchatItemsEditor', () => {
    render(<FacturesForm {...newProps} />)
    expect(screen.getByTestId('achat-items-editor')).toBeInTheDocument()
  })

  it('calls router.post on new form submit', async () => {
    const { router } = await import('@inertiajs/react')
    render(<FacturesForm {...newProps} />)
    fireEvent.submit(screen.getByRole('form'))
    expect(router.post).toHaveBeenCalledWith('/backend/purchase_invoices', expect.any(Object))
  })

  it('calls router.patch on edit form submit', async () => {
    const { router } = await import('@inertiajs/react')
    render(<FacturesForm {...editProps} />)
    fireEvent.submit(screen.getByRole('form'))
    expect(router.patch).toHaveBeenCalledWith('/backend/purchase_invoices/1', expect.any(Object))
  })
})
