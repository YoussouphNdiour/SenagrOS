import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import TravailleursIndex from './Index'

const mockVisit = vi.hoisted(() => vi.fn())
vi.mock('@inertiajs/react', () => ({ router: { visit: mockVisit } }))

const travailleurs = [
  { id: 1, name: 'Mamadou Diop', number: 'T-001', work_number: 'W01', born_at: '1990-03-15T00:00:00Z', dead_at: null },
  { id: 2, name: 'Fatou Sow',    number: 'T-002', work_number: 'W02', born_at: null, dead_at: null },
]
const meta = { total: 2, page: 1, per_page: 50 }

it('renders travailleur names', () => {
  render(<TravailleursIndex travailleurs={travailleurs} meta={meta} />)
  expect(screen.getByText('Mamadou Diop')).toBeInTheDocument()
  expect(screen.getByText('Fatou Sow')).toBeInTheDocument()
})

it('renders total count', () => {
  render(<TravailleursIndex travailleurs={travailleurs} meta={meta} />)
  expect(screen.getByText(/2 travailleur/i)).toBeInTheDocument()
})

it('renders empty state when no travailleurs', () => {
  render(<TravailleursIndex travailleurs={[]} meta={{ total: 0, page: 1, per_page: 50 }} />)
  expect(screen.getByText(/aucun travailleur/i)).toBeInTheDocument()
})

it('name links to show page', () => {
  render(<TravailleursIndex travailleurs={travailleurs} meta={meta} />)
  const link = screen.getByRole('link', { name: 'Mamadou Diop' })
  expect(link).toHaveAttribute('href', '/backend/workers/1')
})

it('pagination: calls router.visit with page param', () => {
  const bigMeta = { total: 100, page: 1, per_page: 50 }
  render(<TravailleursIndex travailleurs={travailleurs} meta={bigMeta} />)
  fireEvent.click(screen.getByRole('button', { name: /suivant/i }))
  expect(mockVisit).toHaveBeenCalledWith('/backend/workers?page=2')
})
