import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import JournalEntryShow from './Show'

vi.mock('@inertiajs/react', () => ({ usePage: vi.fn() }))

import { usePage } from '@inertiajs/react'

const sharedProps = {
  appShell: { campaign: { name: 'Hivernage 2024' }, user: { name: 'Yoûssouph N.', initials: 'YN' } },
}

beforeEach(() => {
  vi.mocked(usePage).mockReturnValue({
    props: sharedProps,
    url: '/backend/journal_entries/1',
  } as unknown as ReturnType<typeof usePage>)
})

const mockEntry = {
  id: 1,
  number: 'E2024001',
  name: 'Achat semences mil',
  state: 'draft',
  printed_on: '2024-07-01',
  real_debit: 150000,
  real_credit: 150000,
  real_currency: 'XOF',
  real_currency_rate: 1,
  reference_number: 'REF001',
  continuous_number: '42',
  validated_at: null,
  journal_name: 'Achats',
  financial_year_name: '2024',
}

const mockItems = [
  {
    id: 1,
    position: 1,
    name: 'Achat semences',
    account_number: '60100000',
    account_name: 'Achats matières premières',
    real_debit: 150000,
    real_credit: 0,
    letter: '',
  },
  {
    id: 2,
    position: 2,
    name: 'Fournisseur semences',
    account_number: '40110000',
    account_name: 'Fournisseurs',
    real_debit: 0,
    real_credit: 150000,
    letter: 'A',
  },
]

describe('JournalEntryShow', () => {
  it('renders entry number and name', () => {
    render(<JournalEntryShow entry={mockEntry} items={[]} />)
    expect(screen.getByText('E2024001')).toBeInTheDocument()
    expect(screen.getByText('Achat semences mil')).toBeInTheDocument()
  })

  it('shows draft state badge', () => {
    render(<JournalEntryShow entry={mockEntry} items={[]} />)
    expect(screen.getByText('Brouillon')).toBeInTheDocument()
  })

  it('shows balanced when debit equals credit', () => {
    render(<JournalEntryShow entry={mockEntry} items={[]} />)
    expect(screen.getByText('Équilibrée')).toBeInTheDocument()
  })

  it('renders items table with account numbers', () => {
    render(<JournalEntryShow entry={mockEntry} items={mockItems} />)
    expect(screen.getByText('60100000')).toBeInTheDocument()
    expect(screen.getByText('40110000')).toBeInTheDocument()
  })

  it('shows lettering badge', () => {
    render(<JournalEntryShow entry={mockEntry} items={mockItems} />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('shows journal name', () => {
    render(<JournalEntryShow entry={mockEntry} items={[]} />)
    const matches = screen.getAllByText(/Achats/)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })
})
