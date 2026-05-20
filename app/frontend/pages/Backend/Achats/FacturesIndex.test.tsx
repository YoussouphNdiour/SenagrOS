// app/frontend/pages/Backend/Achats/FacturesIndex.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import FacturesIndex from './FacturesIndex'
import type { FacturesIndexProps } from '../../../types/achat'

vi.mock('@inertiajs/react', () => ({
  router: { get: vi.fn(), delete: vi.fn() },
  usePage: () => ({ url: '/backend/purchase_invoices' }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

const defaultProps: FacturesIndexProps = {
  factures: [
    {
      id: 1, number: 'FAC-001', reference_number: 'RF-100', invoiced_at: '2025-06-15',
      supplier: { id: 10, full_name: 'Agro Sénégal' }, nature_name: null,
      pretax_amount: 80000, amount: 94400, currency: 'XOF',
      reconciliation_state: 'to_reconcile', unpaid: true,
      description: null, payment_delay: '30 jours', responsible_name: null,
      items: [], destroyable: false, updatable: true,
    },
    {
      id: 2, number: 'FAC-002', reference_number: null, invoiced_at: '2025-05-20',
      supplier: { id: 11, full_name: 'Fournisseur Dakar' }, nature_name: null,
      pretax_amount: 45000, amount: 53100, currency: 'XOF',
      reconciliation_state: 'reconcile', unpaid: false,
      description: null, payment_delay: null, responsible_name: null,
      items: [], destroyable: true, updatable: true,
    },
  ],
  filters: { q: '', reconciliation_state: [], unpaid: false },
  meta: { current_page: 1, total_pages: 1, total_count: 2 },
}

describe('FacturesIndex', () => {
  it('renders invoice numbers', () => {
    render(<FacturesIndex {...defaultProps} />)
    expect(screen.getByText('FAC-001')).toBeInTheDocument()
    expect(screen.getByText('FAC-002')).toBeInTheDocument()
  })

  it('renders supplier names', () => {
    render(<FacturesIndex {...defaultProps} />)
    expect(screen.getByText('Agro Sénégal')).toBeInTheDocument()
    expect(screen.getByText('Fournisseur Dakar')).toBeInTheDocument()
  })

  it('renders reconciliation badge labels', () => {
    render(<FacturesIndex {...defaultProps} />)
    expect(screen.getByText('À réconcilier')).toBeInTheDocument()
    expect(screen.getByText('Réconciliée')).toBeInTheDocument()
  })

  it('renders "Nouvelle facture" button', () => {
    render(<FacturesIndex {...defaultProps} />)
    expect(screen.getByText('Nouvelle facture')).toBeInTheDocument()
  })

  it('renders "Non payées uniquement" toggle', () => {
    render(<FacturesIndex {...defaultProps} />)
    expect(screen.getByLabelText(/Non payées uniquement/i)).toBeInTheDocument()
  })

  it('calls router.delete when delete button clicked and confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { router } = await import('@inertiajs/react')
    render(<FacturesIndex {...defaultProps} />)
    fireEvent.click(screen.getAllByRole('button', { name: /supprimer/i })[0])
    expect(router.delete).toHaveBeenCalledWith('/backend/purchase_invoices/2')
  })
})
