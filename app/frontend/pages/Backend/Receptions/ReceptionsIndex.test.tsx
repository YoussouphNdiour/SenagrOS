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
})
