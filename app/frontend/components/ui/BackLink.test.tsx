import { render, screen } from '@testing-library/react'
import { BackLink } from './BackLink'

test('renders link with correct href and label', () => {
  render(<BackLink href="/backend/animals" label="Liste des animaux" />)
  const link = screen.getByRole('link', { name: /liste des animaux/i })
  expect(link).toHaveAttribute('href', '/backend/animals')
})

test('renders ArrowLeft icon', () => {
  const { container } = render(<BackLink href="/backend/animals" label="Retour" />)
  expect(container.querySelector('svg')).toBeTruthy()
})
