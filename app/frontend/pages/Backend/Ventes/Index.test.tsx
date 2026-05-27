import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { router } from '@inertiajs/react'
import Index from './Index'
import type { VentesIndexProps } from '../../../types/vente'

vi.mock('@inertiajs/react', () => ({
  router: { get: vi.fn(), delete: vi.fn(), post: vi.fn() },
}))

const defaultProps: VentesIndexProps = {
  sales: [
    {
      id: 1,
      number: 'VT-2025-0001',
      reference_number: 'REF-001',
      state: 'invoice',
      state_label: 'Facture',
      client_name: 'Mamadou Diallo',
      created_at: '2025-06-01T10:00:00Z',
      invoiced_at: '2025-06-05T10:00:00Z',
      pretax_amount: 100000,
      amount: 118000,
      currency: 'XOF',
      updateable: false,
      canDestroy: false,
      cancellable: false,
    },
    {
      id: 2,
      number: 'VT-2025-0002',
      reference_number: null,
      state: 'draft',
      state_label: 'Brouillon',
      client_name: 'Fatou Sow',
      created_at: '2025-06-10T08:00:00Z',
      invoiced_at: null,
      pretax_amount: 50000,
      amount: 50000,
      currency: 'XOF',
      updateable: true,
      canDestroy: true,
      cancellable: false,
    },
  ],
  meta: { total: 2, page: 1, per_page: 25 },
  filters: {
    q: null,
    state: [],
    period: null,
    started_on: null,
    stopped_on: null,
    nature: 'all',
    responsible_id: null,
  },
  responsibles: [],
  natures: [{ id: 1, name: 'Vente directe', currency: 'XOF', payment_delay: '30j' }],
}

describe('Ventes Index', () => {
  it('renders both sale numbers', () => {
    render(<Index {...defaultProps} />)
    expect(screen.getByText('VT-2025-0001')).toBeInTheDocument()
    expect(screen.getByText('VT-2025-0002')).toBeInTheDocument()
  })

  it('renders client names', () => {
    render(<Index {...defaultProps} />)
    expect(screen.getByText('Mamadou Diallo')).toBeInTheDocument()
    expect(screen.getByText('Fatou Sow')).toBeInTheDocument()
  })

  it('renders state badges with labels', () => {
    render(<Index {...defaultProps} />)
    expect(screen.getByText('Facture')).toBeInTheDocument()
    expect(screen.getByText('Brouillon')).toBeInTheDocument()
  })

  it('renders Nouvelle vente button', () => {
    render(<Index {...defaultProps} />)
    expect(screen.getByText(/Nouvelle vente/i)).toBeInTheDocument()
  })

  it('renders total count', () => {
    render(<Index {...defaultProps} />)
    expect(screen.getByText(/2 vente/i)).toBeInTheDocument()
  })

  it('calls router.delete when destroy button clicked and confirmed', () => {
    window.confirm = vi.fn(() => true)
    render(<Index {...{ ...defaultProps, sales: [{ ...defaultProps.sales[1] }] }} />)
    // sale[1] has canDestroy: true
    const destroyBtn = screen.getByTitle('Supprimer')
    fireEvent.click(destroyBtn)
    expect(window.confirm).toHaveBeenCalled()
    expect(router.delete).toHaveBeenCalledWith('/backend/sales/2')
  })
})
