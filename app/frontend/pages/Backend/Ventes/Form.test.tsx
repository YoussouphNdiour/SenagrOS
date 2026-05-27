import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Form from './Form'
import type { VentesFormProps } from '../../../types/vente'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), patch: vi.fn() },
}))

// Mock VenteItemsEditor to simplify testing the Form
vi.mock('../../../components/ventes/VenteItemsEditor', () => ({
  default: ({ onChange }: { onChange: (items: never[]) => void }) => (
    <div>
      <button type="button" onClick={() => onChange([])}>Ajouter une ligne</button>
    </div>
  ),
}))

const defaultProps: VentesFormProps = {
  sale: {
    id: null,
    number: null,
    state: null,
    nature_id: 1,
    client_id: null,
    client_name: null,
    invoiced_at: null,
    reference_number: null,
    responsible_id: null,
    responsible_name: null,
    payment_delay: '30j',
    description: null,
    currency: 'XOF',
    items: [],
  },
  natures: [{ id: 1, name: 'Vente directe', currency: 'XOF', payment_delay: '30j' }],
  taxes: [{ id: 1, name: 'TVA 18%', short_label: '18%', amount: 0.18 }],
  errors: {},
}

describe('Ventes Form', () => {
  it('renders Nouvelle vente heading for new sale', () => {
    render(<Form {...defaultProps} />)
    expect(screen.getByText(/Nouvelle vente/i)).toBeInTheDocument()
  })

  it('renders Modifier heading for existing sale', () => {
    render(<Form {...{ ...defaultProps, sale: { ...defaultProps.sale, id: 5, number: 'VT-0005' } }} />)
    expect(screen.getByText(/Modifier/i)).toBeInTheDocument()
    expect(screen.getByText(/VT-0005/i)).toBeInTheDocument()
  })

  it('renders client name input', () => {
    render(<Form {...defaultProps} />)
    expect(screen.getByPlaceholderText(/Nom du client/i)).toBeInTheDocument()
  })

  it('renders VenteItemsEditor (mocked)', () => {
    render(<Form {...defaultProps} />)
    expect(screen.getByRole('button', { name: /Ajouter/i })).toBeInTheDocument()
  })

  it('calls router.post on submit for new sale', async () => {
    const { router } = await import('@inertiajs/react')
    render(<Form {...defaultProps} />)
    fireEvent.submit(screen.getByRole('form'))
    expect(router.post).toHaveBeenCalledWith('/backend/sales', expect.objectContaining({ sale: expect.any(Object) }))
  })

  it('calls router.patch on submit for existing sale', async () => {
    const { router } = await import('@inertiajs/react')
    render(<Form {...{ ...defaultProps, sale: { ...defaultProps.sale, id: 5, number: 'VT-0005' } }} />)
    fireEvent.submit(screen.getByRole('form'))
    expect(router.patch).toHaveBeenCalledWith('/backend/sales/5', expect.objectContaining({ sale: expect.any(Object) }))
  })

  it('displays error messages', () => {
    render(<Form {...{ ...defaultProps, errors: { client_id: ['est obligatoire'] } }} />)
    expect(screen.getAllByText('est obligatoire').length).toBeGreaterThan(0)
  })
})
