import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { router } from '@inertiajs/react'
import Show from './Show'
import type { VentesShowProps } from '../../../types/vente'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), delete: vi.fn() },
}))

const defaultProps: VentesShowProps = {
  sale: {
    id: 1,
    number: 'VT-2025-0001',
    reference_number: 'REF-001',
    initial_number: null,
    state: 'order',
    state_label: 'Commande',
    currency: 'XOF',
    pretax_amount: 100000,
    amount: 118000,
    affair_balance: 118000,
    affair_closed: false,
    invoiced_at: null,
    confirmed_at: '2025-06-02T10:00:00Z',
    created_at: '2025-06-01T10:00:00Z',
    payment_delay: '30j',
    description: 'Commande de mil',
    client: { id: 10, full_name: 'Mamadou Diallo', number: 'CLI-001', default_mail_address_id: null },
    client_number: 'CLI-001',
    responsible_id: 5,
    responsible_name: 'Fatou Ndiaye',
    nature_id: 1,
    nature_name: 'Vente directe',
    address: null,
    invoice_address: null,
    items: [
      {
        id: 100,
        variant_id: 10,
        variant_name: 'Mil',
        conditioning_unit_id: 1,
        conditioning_unit_name: 'kg',
        conditioning_quantity: 100,
        unit_pretax_amount: 1000,
        tax_id: 1,
        tax_rate: 0.18,
        reduction_percentage: 0,
        pretax_amount: 100000,
        amount: 118000,
        label: null,
        annotation: null,
      },
    ],
    affair: {
      balance: 118000,
      closed: false,
      incoming_payments: [],
    },
    shipments: [],
    credits: [],
    updateable: true,
    canDestroy: false,
    cancellable: true,
    can_generate_parcel: true,
  },
}

describe('Ventes Show', () => {
  it('renders sale number', () => {
    render(<Show {...defaultProps} />)
    expect(screen.getByText('VT-2025-0001')).toBeInTheDocument()
  })

  it('renders client name', () => {
    render(<Show {...defaultProps} />)
    expect(screen.getByText('Mamadou Diallo')).toBeInTheDocument()
  })

  it('renders item in table', () => {
    render(<Show {...defaultProps} />)
    expect(screen.getByText('Mil')).toBeInTheDocument()
  })

  it('renders Facturer button when state is order', () => {
    render(<Show {...defaultProps} />)
    expect(screen.getByRole('button', { name: /Facturer/i })).toBeInTheDocument()
  })

  it('renders Proposer button when state is draft', () => {
    render(<Show { ...{ ...defaultProps, sale: { ...defaultProps.sale, state: 'draft' } } } />)
    expect(screen.getByRole('button', { name: /Proposer/i })).toBeInTheDocument()
  })

  it('renders affair balance', () => {
    render(<Show {...defaultProps} />)
    expect(screen.getAllByText(/118/).length).toBeGreaterThan(0)
  })

  it('calls router.post when Facturer clicked', () => {
    render(<Show {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Facturer/i }))
    expect(router.post).toHaveBeenCalledWith('/backend/sales/1/invoice')
  })
})
