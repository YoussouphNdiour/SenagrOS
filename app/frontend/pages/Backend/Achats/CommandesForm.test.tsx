// app/frontend/pages/Backend/Achats/CommandesForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import CommandesForm from './CommandesForm'
import type { CommandesFormProps } from '../../../types/achat'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), patch: vi.fn() },
  usePage: () => ({ url: '/backend/purchase_orders/new' }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

vi.mock('../../../components/achats/AchatItemsEditor', () => ({
  default: () => <div data-testid="achat-items-editor">AchatItemsEditor</div>,
}))

const natures = [{ id: 1, name: 'Achat standard', currency: 'XOF', payment_delay: null }]
const taxes = [{ id: 1, name: 'TVA 18%', short_label: '18%', amount: 0.18 }]

const newProps: CommandesFormProps = {
  commande: { currency: 'XOF', items: [] },
  natures,
  taxes,
  errors: {},
}

const editProps: CommandesFormProps = {
  commande: {
    id: 1, number: 'CMD-001', reference_number: 'REF-A', state: 'opened',
    ordered_at: '2025-06-01', supplier: { id: 10, full_name: 'Agro Sénégal' },
    nature_name: null, pretax_amount: 0, amount: 0, currency: 'XOF',
    description: null, responsible_name: null, items: [], receptions_count: 0, canDestroy: false,
  },
  natures,
  taxes,
  errors: {},
}

describe('CommandesForm', () => {
  it('renders "Nouvelle commande" heading for new form', () => {
    render(<CommandesForm {...newProps} />)
    expect(screen.getByText('Nouvelle commande')).toBeInTheDocument()
  })

  it('renders "Modifier" heading with number for edit form', () => {
    render(<CommandesForm {...editProps} />)
    expect(screen.getByText(/Modifier la commande/)).toBeInTheDocument()
    expect(screen.getByText(/CMD-001/)).toBeInTheDocument()
  })

  it('renders supplier input', () => {
    render(<CommandesForm {...newProps} />)
    expect(screen.getByPlaceholderText(/fournisseur/i)).toBeInTheDocument()
  })

  it('renders AchatItemsEditor', () => {
    render(<CommandesForm {...newProps} />)
    expect(screen.getByTestId('achat-items-editor')).toBeInTheDocument()
  })

  it('calls router.post on new form submit', async () => {
    const { router } = await import('@inertiajs/react')
    render(<CommandesForm {...newProps} />)
    fireEvent.submit(screen.getByRole('form'))
    expect(router.post).toHaveBeenCalledWith('/backend/purchase_orders', expect.any(Object))
  })

  it('calls router.patch on edit form submit', async () => {
    const { router } = await import('@inertiajs/react')
    render(<CommandesForm {...editProps} />)
    fireEvent.submit(screen.getByRole('form'))
    expect(router.patch).toHaveBeenCalledWith('/backend/purchase_orders/1', expect.any(Object))
  })
})
