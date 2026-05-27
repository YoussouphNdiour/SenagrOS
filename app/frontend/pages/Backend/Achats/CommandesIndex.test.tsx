// app/frontend/pages/Backend/Achats/CommandesIndex.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import CommandesIndex from './CommandesIndex'
import type { CommandesIndexProps } from '../../../types/achat'

vi.mock('@inertiajs/react', () => ({
  router: { get: vi.fn(), delete: vi.fn() },
  usePage: () => ({ url: '/backend/purchase_orders' }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

const defaultProps: CommandesIndexProps = {
  commandes: [
    {
      id: 1, number: 'CMD-001', reference_number: 'REF-A', state: 'opened',
      ordered_at: '2025-06-01', supplier: { id: 10, full_name: 'Agro Sénégal' },
      nature_name: 'Achat standard', pretax_amount: 50000, amount: 59000,
      currency: 'XOF', description: null, responsible_name: null,
      items: [], receptions_count: 0, canDestroy: true,
    },
    {
      id: 2, number: 'CMD-002', reference_number: null, state: 'closed',
      ordered_at: '2025-05-15', supplier: { id: 11, full_name: 'Fournisseur Dakar' },
      nature_name: null, pretax_amount: 120000, amount: 141600,
      currency: 'XOF', description: null, responsible_name: null,
      items: [], receptions_count: 2, canDestroy: false,
    },
  ],
  filters: { q: '', state: [] },
  meta: { current_page: 1, total_pages: 1, total_count: 2 },
}

describe('CommandesIndex', () => {
  it('renders order numbers', () => {
    render(<CommandesIndex {...defaultProps} />)
    expect(screen.getByText('CMD-001')).toBeInTheDocument()
    expect(screen.getByText('CMD-002')).toBeInTheDocument()
  })

  it('renders supplier names', () => {
    render(<CommandesIndex {...defaultProps} />)
    expect(screen.getByText('Agro Sénégal')).toBeInTheDocument()
    expect(screen.getByText('Fournisseur Dakar')).toBeInTheDocument()
  })

  it('renders state badge labels', () => {
    render(<CommandesIndex {...defaultProps} />)
    expect(screen.getByText('En cours')).toBeInTheDocument()
    expect(screen.getByText('Clôturée')).toBeInTheDocument()
  })

  it('renders "Nouvelle commande" button', () => {
    render(<CommandesIndex {...defaultProps} />)
    expect(screen.getByText('Nouvelle commande')).toBeInTheDocument()
  })

  it('shows total count', () => {
    render(<CommandesIndex {...defaultProps} />)
    expect(screen.getByText(/2 commande/)).toBeInTheDocument()
  })

  it('calls router.delete when delete button clicked and confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { router } = await import('@inertiajs/react')
    render(<CommandesIndex {...defaultProps} />)
    fireEvent.click(screen.getAllByRole('button', { name: /supprimer/i })[0])
    expect(router.delete).toHaveBeenCalledWith('/backend/purchase_orders/1')
  })
})
