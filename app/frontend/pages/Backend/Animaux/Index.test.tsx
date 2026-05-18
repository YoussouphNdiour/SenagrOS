import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import AnimauxIndex from './Index'

const mockVisit = vi.hoisted(() => vi.fn())
vi.mock('@inertiajs/react', () => ({ router: { visit: mockVisit } }))

const animaux = [
  { id: 1, name: 'Ndeye', number: 'A-001', work_number: '', variety: 'bos_taurus', born_at: '2020-01-10T00:00:00Z', dead_at: null },
  { id: 2, name: 'Moussa', number: 'A-002', work_number: '', variety: 'bos_taurus', born_at: null, dead_at: '2023-06-01T00:00:00Z' },
]
const meta = { total: 2, page: 1, per_page: 50 }

it('renders animal names', () => {
  render(<AnimauxIndex animaux={animaux} meta={meta} />)
  expect(screen.getByText('Ndeye')).toBeInTheDocument()
  expect(screen.getByText('Moussa')).toBeInTheDocument()
})

it('renders total count', () => {
  render(<AnimauxIndex animaux={animaux} meta={meta} />)
  expect(screen.getByText(/2 animal/i)).toBeInTheDocument()
})

it('renders empty state', () => {
  render(<AnimauxIndex animaux={[]} meta={{ total: 0, page: 1, per_page: 50 }} />)
  expect(screen.getByText(/aucun animal/i)).toBeInTheDocument()
})

it('name links to show page', () => {
  render(<AnimauxIndex animaux={animaux} meta={meta} />)
  const link = screen.getByRole('link', { name: 'Ndeye' })
  expect(link).toHaveAttribute('href', '/backend/animals/1')
})

it('pagination calls router.visit', () => {
  const bigMeta = { total: 100, page: 1, per_page: 50 }
  render(<AnimauxIndex animaux={animaux} meta={bigMeta} />)
  fireEvent.click(screen.getByRole('button', { name: /suivant/i }))
  expect(mockVisit).toHaveBeenCalledWith('/backend/animals?page=2')
})
