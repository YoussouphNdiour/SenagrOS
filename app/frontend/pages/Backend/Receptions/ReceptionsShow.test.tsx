// app/frontend/pages/Backend/Receptions/ReceptionsShow.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import ReceptionsShow from './ReceptionsShow'
import type { ReceptionsShowProps } from '../../../types/reception'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), delete: vi.fn() },
  usePage: () => ({ url: '/backend/receptions/1' }),
}))

const baseReception = {
  id: 1, number: 'REC-001', reference_number: 'REF-42',
  state: 'draft' as const, planned_at: '2025-06-01', given_at: null,
  supplier: { id: 10, full_name: 'Agro Sénégal' },
  purchase_order: { id: 5, number: 'CMD-005' },
  reconciliation_state: 'to_reconcile' as const,
  pretax_amount: 50000, currency: 'XOF',
  items: [
    { id: 1, variant_name: 'Semences mil', conditioning_quantity: 10,
      unit_pretax_amount: 500, role: 'merchandise' as const,
      non_compliant: false, annotation: null, purchase_invoice_item_id: null }
  ],
  canDestroy: true, invoiceable: false,
}

describe('ReceptionsShow', () => {
  it('renders number and supplier', () => {
    render(<ReceptionsShow reception={baseReception} />)
    expect(screen.getByText('REC-001')).toBeInTheDocument()
    expect(screen.getAllByText('Agro Sénégal')).toHaveLength(2)
  })

  it('renders item row', () => {
    render(<ReceptionsShow reception={baseReception} />)
    expect(screen.getByText('Semences mil')).toBeInTheDocument()
  })

  it('shows "Valider" when state is draft', () => {
    render(<ReceptionsShow reception={baseReception} />)
    expect(screen.getByRole('button', { name: /valider/i })).toBeInTheDocument()
  })

  it('shows "Créer une facture" when invoiceable is true', () => {
    render(<ReceptionsShow reception={{ ...baseReception, state: 'given', invoiceable: true }} />)
    const link = screen.getByRole('link', { name: /créer une facture/i })
    expect(link).toHaveAttribute('href', '/backend/purchase_invoices/new?reception_id=1')
  })

  it('hides "Créer une facture" when invoiceable is false', () => {
    render(<ReceptionsShow reception={baseReception} />)
    expect(screen.queryByText(/créer une facture/i)).not.toBeInTheDocument()
  })

  it('calls router.delete on Supprimer click', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { router } = await import('@inertiajs/react')
    render(<ReceptionsShow reception={baseReception} />)
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }))
    expect(router.delete).toHaveBeenCalledWith('/backend/receptions/1')
  })
})
