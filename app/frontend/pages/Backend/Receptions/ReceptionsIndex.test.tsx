// app/frontend/pages/Backend/Receptions/ReceptionsIndex.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import ReceptionsIndex from './ReceptionsIndex'
import type { ReceptionsIndexProps } from '../../../types/reception'

vi.mock('@inertiajs/react', () => ({
  router: { get: vi.fn(), delete: vi.fn() },
  usePage: () => ({ url: '/backend/receptions' }),
}))

const defaultProps: ReceptionsIndexProps = {
  receptions: [
    {
      id: 1, number: 'REC-001', reference_number: 'REF-A', state: 'draft',
      planned_at: '2025-06-01', given_at: null,
      supplier: { id: 10, full_name: 'Agro Sénégal' },
      purchase_order: { id: 5, number: 'CMD-005' },
      reconciliation_state: 'to_reconcile',
      pretax_amount: 50000, currency: 'XOF',
      items: [], destroyable: true, invoiceable: false,
    },
    {
      id: 2, number: 'REC-002', reference_number: null, state: 'given',
      planned_at: '2025-05-15', given_at: '2025-05-16',
      supplier: { id: 11, full_name: 'Fournisseur Dakar' },
      purchase_order: null,
      reconciliation_state: 'reconcile',
      pretax_amount: 120000, currency: 'XOF',
      items: [], destroyable: false, invoiceable: false,
    },
  ],
  filters: { q: '', state: [] },
  meta: { current_page: 1, total_pages: 1, total_count: 2 },
}

const invoiceableProps: ReceptionsIndexProps = {
  receptions: [
    {
      id: 10, number: 'REC-010', reference_number: null, state: 'given',
      planned_at: '2025-06-01', given_at: '2025-06-02',
      supplier: { id: 20, full_name: 'Fournisseur A' },
      purchase_order: null,
      reconciliation_state: 'to_reconcile',
      pretax_amount: 80000, currency: 'XOF',
      items: [], destroyable: false, invoiceable: true,
    },
    {
      id: 11, number: 'REC-011', reference_number: null, state: 'given',
      planned_at: '2025-06-03', given_at: '2025-06-04',
      supplier: { id: 21, full_name: 'Fournisseur B' },
      purchase_order: null,
      reconciliation_state: 'to_reconcile',
      pretax_amount: 60000, currency: 'XOF',
      items: [], destroyable: false, invoiceable: true,
    },
  ],
  filters: { q: '', state: [] },
  meta: { current_page: 1, total_pages: 1, total_count: 2 },
}

describe('ReceptionsIndex', () => {
  it('renders reception numbers', () => {
    render(<ReceptionsIndex {...defaultProps} />)
    expect(screen.getByText('REC-001')).toBeInTheDocument()
    expect(screen.getByText('REC-002')).toBeInTheDocument()
  })

  it('renders supplier names', () => {
    render(<ReceptionsIndex {...defaultProps} />)
    expect(screen.getByText('Agro Sénégal')).toBeInTheDocument()
    expect(screen.getByText('Fournisseur Dakar')).toBeInTheDocument()
  })

  it('renders state badge labels', () => {
    render(<ReceptionsIndex {...defaultProps} />)
    expect(screen.getByText('Brouillon')).toBeInTheDocument()
    expect(screen.getByText('Validée')).toBeInTheDocument()
  })

  it('renders "Nouvelle réception" link', () => {
    render(<ReceptionsIndex {...defaultProps} />)
    expect(screen.getByText(/Nouvelle réception/)).toBeInTheDocument()
  })

  it('shows total count in meta', () => {
    render(<ReceptionsIndex {...defaultProps} />)
    expect(screen.getByText(/2 réception/)).toBeInTheDocument()
  })

  it('calls router.delete after confirm on destroyable row', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { router } = await import('@inertiajs/react')
    render(<ReceptionsIndex {...defaultProps} />)
    fireEvent.click(screen.getAllByRole('button', { name: /supprimer/i })[0])
    expect(router.delete).toHaveBeenCalledWith('/backend/receptions/1')
  })

  it('renders enabled checkbox for invoiceable reception', () => {
    render(<ReceptionsIndex {...invoiceableProps} />)
    const checkboxes = screen.getAllByRole('checkbox', { name: /Sélectionner la réception REC-01/ })
    expect(checkboxes[0]).toBeEnabled()
  })

  it('renders disabled checkbox for non-invoiceable and enabled for invoiceable', () => {
    const mixedProps: ReceptionsIndexProps = {
      receptions: [
        { ...invoiceableProps.receptions[0] },           // invoiceable: true  (id: 10, REC-010)
        { ...defaultProps.receptions[0], id: 99, number: 'REC-099', invoiceable: false },  // invoiceable: false
      ],
      filters: { q: '', state: [] },
      meta: { current_page: 1, total_pages: 1, total_count: 2 },
    }
    render(<ReceptionsIndex {...mixedProps} />)
    const invoiceableCb = screen.getByRole('checkbox', { name: /Sélectionner la réception REC-010/ })
    const nonInvoiceableCb = screen.getByRole('checkbox', { name: /Sélectionner la réception REC-099/ })
    expect(invoiceableCb).toBeEnabled()
    expect(nonInvoiceableCb).toBeDisabled()
  })

  it('hides action bar when fewer than 2 receptions selected', () => {
    render(<ReceptionsIndex {...invoiceableProps} />)
    const checkboxes = screen.getAllByRole('checkbox', { name: /Sélectionner la réception/ })
    fireEvent.click(checkboxes[0])
    expect(screen.queryByText(/Créer une facture groupée/)).not.toBeInTheDocument()
  })

  it('shows action bar with correct href when 2 invoiceable selected', () => {
    render(<ReceptionsIndex {...invoiceableProps} />)
    const checkboxes = screen.getAllByRole('checkbox', { name: /Sélectionner la réception/ })
    fireEvent.click(checkboxes[0])
    fireEvent.click(checkboxes[1])
    const link = screen.getByRole('link', { name: /Créer une facture groupée/ })
    const href = link.getAttribute('href') ?? ''
    expect(href).toContain('reception_ids[]=10')
    expect(href).toContain('reception_ids[]=11')
  })
})
