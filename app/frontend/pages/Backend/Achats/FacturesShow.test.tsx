import { render, screen, fireEvent } from '@testing-library/react'
import FacturesShow from './FacturesShow'
import type { FacturesShowProps } from '../../../types/achat'

vi.mock('@inertiajs/react', () => ({
  router: { delete: vi.fn() },
  usePage: () => ({ url: '/backend/purchase_invoices/1' }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

const baseFacture: FacturesShowProps['facture'] = {
  id: 1, number: 'FAC-001', reference_number: 'RF-100', invoiced_at: '2025-06-15',
  supplier: { id: 10, full_name: 'Agro Sénégal' }, nature_name: null,
  pretax_amount: 80000, amount: 94400, currency: 'XOF',
  reconciliation_state: 'to_reconcile', unpaid: true,
  description: 'Facture semences', payment_delay: '30 jours', responsible_name: 'Binta Diallo',
  items: [
    { id: 1, variant_name: 'Engrais NPK', conditioning_quantity: 5, unit_pretax_amount: 16000, tax_id: 1, reduction_percentage: 0, pretax_amount: 80000, amount: 94400 }
  ],
  destroyable: false, updatable: true,
}

describe('FacturesShow', () => {
  it('renders number and supplier', () => {
    render(<FacturesShow facture={baseFacture} />)
    expect(screen.getByText('FAC-001')).toBeInTheDocument()
    expect(screen.getByText('Agro Sénégal')).toBeInTheDocument()
  })

  it('renders item row', () => {
    render(<FacturesShow facture={baseFacture} />)
    expect(screen.getByText('Engrais NPK')).toBeInTheDocument()
  })

  it('shows unpaid badge when unpaid is true', () => {
    render(<FacturesShow facture={baseFacture} />)
    expect(screen.getByText('Non payée')).toBeInTheDocument()
  })

  it('shows paid badge when unpaid is false', () => {
    render(<FacturesShow facture={{ ...baseFacture, unpaid: false }} />)
    expect(screen.getByText('Payée')).toBeInTheDocument()
  })

  it('shows Modifier button when updatable', () => {
    render(<FacturesShow facture={baseFacture} />)
    expect(screen.getByText('Modifier')).toBeInTheDocument()
  })

  it('always shows Dupliquer button', () => {
    render(<FacturesShow facture={{ ...baseFacture, updatable: false }} />)
    expect(screen.getByText('Dupliquer')).toBeInTheDocument()
  })
})
