import { render, screen, fireEvent } from '@testing-library/react'
import { PrimaryButton } from './PrimaryButton'

test('renders as button by default', () => {
  render(<PrimaryButton>Enregistrer</PrimaryButton>)
  expect(screen.getByRole('button', { name: /enregistrer/i })).toBeTruthy()
})

test('renders as anchor when href provided', () => {
  render(<PrimaryButton href="/backend/animals/new">Nouveau</PrimaryButton>)
  const link = screen.getByRole('link', { name: /nouveau/i })
  expect(link).toHaveAttribute('href', '/backend/animals/new')
})

test('calls onClick when clicked', () => {
  const onClick = vi.fn()
  render(<PrimaryButton onClick={onClick}>Click</PrimaryButton>)
  fireEvent.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalledOnce()
})

test('disabled button does not call onClick', () => {
  const onClick = vi.fn()
  render(<PrimaryButton onClick={onClick} disabled>Click</PrimaryButton>)
  fireEvent.click(screen.getByRole('button'))
  expect(onClick).not.toHaveBeenCalled()
})
