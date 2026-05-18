import { render, screen } from '@testing-library/react'
import AnimalShow from './Show'

const animal = {
  id: 1,
  name: 'Ndeye',
  number: 'A-001',
  work_number: '',
  identification_number: 'FR123',
  variety: 'bos_taurus',
  born_at: '2020-01-10T00:00:00Z',
  dead_at: null,
  description: 'Vache laitière',
}

it('renders animal name', () => {
  render(<AnimalShow animal={animal} interventions={[]} />)
  expect(screen.getByText('Ndeye')).toBeInTheDocument()
})

it('renders vivant badge', () => {
  render(<AnimalShow animal={animal} interventions={[]} />)
  expect(screen.getByText('Vivant')).toBeInTheDocument()
})

it('renders décédé badge when dead_at present', () => {
  render(<AnimalShow animal={{ ...animal, dead_at: '2024-01-01T00:00:00Z' }} interventions={[]} />)
  expect(screen.getByText('Décédé')).toBeInTheDocument()
})

it('renders description', () => {
  render(<AnimalShow animal={animal} interventions={[]} />)
  expect(screen.getByText('Vache laitière')).toBeInTheDocument()
})

it('renders variety', () => {
  render(<AnimalShow animal={animal} interventions={[]} />)
  expect(screen.getByText('bos_taurus')).toBeInTheDocument()
})

it('empty state when no interventions', () => {
  render(<AnimalShow animal={animal} interventions={[]} />)
  expect(screen.getByText(/aucune intervention/i)).toBeInTheDocument()
})

it('edit link points to correct URL', () => {
  render(<AnimalShow animal={animal} interventions={[]} />)
  expect(screen.getByRole('link', { name: /modifier/i })).toHaveAttribute('href', '/backend/animals/1/edit')
})
