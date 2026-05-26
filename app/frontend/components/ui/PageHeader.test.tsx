import { render, screen } from '@testing-library/react'
import { PageHeader } from './PageHeader'

test('renders title', () => {
  render(<PageHeader title="Animaux" />)
  expect(screen.getByText('Animaux')).toBeTruthy()
})

test('renders subtitle when provided', () => {
  render(<PageHeader title="Animaux" subtitle="42 animaux" />)
  expect(screen.getByText('42 animaux')).toBeTruthy()
})

test('renders action slot when provided', () => {
  render(<PageHeader title="Animaux" action={<button>Nouveau</button>} />)
  expect(screen.getByRole('button', { name: /nouveau/i })).toBeTruthy()
})

test('does not render subtitle when absent', () => {
  render(<PageHeader title="Animaux" />)
  expect(screen.queryByRole('paragraph')).toBeNull()
})
