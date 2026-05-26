import { render, screen } from '@testing-library/react'
import { StateBadge } from './StateBadge'
import { CodeBadge } from './CodeBadge'

test('StateBadge renders label', () => {
  render(<StateBadge label="En cours" color="var(--color-warning)" bg="var(--color-warning-bg)" />)
  expect(screen.getByText('En cours')).toBeTruthy()
})

test('StateBadge renders dot by default', () => {
  const { container } = render(
    <StateBadge label="En cours" color="var(--color-warning)" bg="var(--color-warning-bg)" />
  )
  const spans = container.querySelectorAll('span')
  expect(spans.length).toBeGreaterThanOrEqual(2)
})

test('StateBadge hides dot when dot=false', () => {
  const { container } = render(
    <StateBadge label="En cours" color="var(--color-warning)" bg="var(--color-warning-bg)" dot={false} />
  )
  const spans = container.querySelectorAll('span')
  expect(spans.length).toBe(1)
})

test('CodeBadge default renders with info style', () => {
  render(<CodeBadge value="ANA-001" />)
  expect(screen.getByText('ANA-001')).toBeTruthy()
})

test('CodeBadge warning variant renders', () => {
  render(<CodeBadge value="Code manquant" variant="warning" />)
  expect(screen.getByText('Code manquant')).toBeTruthy()
})
