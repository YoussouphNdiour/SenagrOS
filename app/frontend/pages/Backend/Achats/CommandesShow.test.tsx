// app/frontend/pages/Backend/Achats/CommandesShow.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import CommandesShow from './CommandesShow'
import type { CommandesShowProps } from '../../../types/achat'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), delete: vi.fn() },
  usePage: () => ({ url: '/backend/purchase_orders/1' }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

const baseCommande: CommandesShowProps['commande'] = {
  id: 1, number: 'CMD-001', reference_number: 'REF-A', state: 'opened',
  ordered_at: '2025-06-01', supplier: { id: 10, full_name: 'Agro Sénégal' },
  nature_name: 'Achat standard', pretax_amount: 50000, amount: 59000,
  currency: 'XOF', description: 'Commande semences', responsible_name: 'Binta Diallo',
  items: [
    { id: 1, variant_name: 'Semences mil', conditioning_quantity: 10, unit_pretax_amount: 5000, tax_id: 1, reduction_percentage: 0, pretax_amount: 50000, amount: 59000 }
  ],
  receptions_count: 0, canDestroy: false,
}

describe('CommandesShow', () => {
  it('renders number and supplier', () => {
    render(<CommandesShow commande={baseCommande} />)
    expect(screen.getByText('CMD-001')).toBeInTheDocument()
    expect(screen.getByText('Agro Sénégal')).toBeInTheDocument()
  })

  it('renders item row', () => {
    render(<CommandesShow commande={baseCommande} />)
    expect(screen.getByText('Semences mil')).toBeInTheDocument()
  })

  it('shows "Clôturer" when state is opened', () => {
    render(<CommandesShow commande={baseCommande} />)
    expect(screen.getByText('Clôturer')).toBeInTheDocument()
  })

  it('shows "Rouvrir" when state is closed', () => {
    render(<CommandesShow commande={{ ...baseCommande, state: 'closed' }} />)
    expect(screen.getByText('Rouvrir')).toBeInTheDocument()
  })

  it('calls router.post on Clôturer click', async () => {
    const { router } = await import('@inertiajs/react')
    render(<CommandesShow commande={baseCommande} />)
    fireEvent.click(screen.getByText('Clôturer'))
    expect(router.post).toHaveBeenCalledWith('/backend/purchase_orders/1/close')
  })

  it('shows receptions link when receptions_count > 0', () => {
    render(<CommandesShow commande={{ ...baseCommande, receptions_count: 3 }} />)
    expect(screen.getByText(/3 réception/)).toBeInTheDocument()
  })
})
