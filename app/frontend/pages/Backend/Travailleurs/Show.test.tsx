import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import TravailleurShow from './Show'

vi.mock('@inertiajs/react', () => ({ router: { delete: vi.fn() } }))

const travailleur = {
  id: 1,
  name: 'Mamadou Diop',
  number: 'T-001',
  work_number: 'W01',
  identification_number: 'ID-123',
  born_at: '1990-03-15T00:00:00Z',
  dead_at: null,
  description: 'Chauffeur principal',
}
const interventions = [
  { id: 10, name: 'Semis parcelle A', started_at: '2024-03-01T08:00:00Z', state: 'done' },
]

it('renders travailleur name', () => {
  render(<TravailleurShow travailleur={travailleur} interventions={[]} canDestroy={true} />)
  expect(screen.getByText('Mamadou Diop')).toBeInTheDocument()
})

it('renders actif badge when no dead_at', () => {
  render(<TravailleurShow travailleur={travailleur} interventions={[]} canDestroy={true} />)
  expect(screen.getByText('Actif')).toBeInTheDocument()
})

it('renders inactif badge when dead_at present', () => {
  render(<TravailleurShow travailleur={{ ...travailleur, dead_at: '2024-01-01T00:00:00Z' }} interventions={[]} canDestroy={true} />)
  expect(screen.getByText('Inactif')).toBeInTheDocument()
})

it('renders description', () => {
  render(<TravailleurShow travailleur={travailleur} interventions={[]} canDestroy={true} />)
  expect(screen.getByText('Chauffeur principal')).toBeInTheDocument()
})

it('renders intervention list', () => {
  render(<TravailleurShow travailleur={travailleur} interventions={interventions} canDestroy={true} />)
  expect(screen.getByText('Semis parcelle A')).toBeInTheDocument()
})

it('renders empty state when no interventions', () => {
  render(<TravailleurShow travailleur={travailleur} interventions={[]} canDestroy={true} />)
  expect(screen.getByText(/aucune intervention/i)).toBeInTheDocument()
})

it('shows edit link', () => {
  render(<TravailleurShow travailleur={travailleur} interventions={[]} canDestroy={true} />)
  const editLink = screen.getByRole('link', { name: /modifier/i })
  expect(editLink).toHaveAttribute('href', '/backend/workers/1/edit')
})
