import { render, screen } from '@testing-library/react'
import { Wallet } from 'lucide-react'
import { KpiCard } from './KpiCard'
import { EmptyState } from './EmptyState'
import { ProgressBar } from './ProgressBar'

test('KpiCard renders label and value', () => {
  render(<KpiCard icon={<Wallet size={16} />} label="Total budgets" value={42} color="var(--color-primary)" />)
  expect(screen.getByText('Total budgets')).toBeTruthy()
  expect(screen.getByText('42')).toBeTruthy()
})

test('EmptyState renders message', () => {
  render(<EmptyState icon={Wallet} message="Aucun budget" />)
  expect(screen.getByText('Aucun budget')).toBeTruthy()
})

test('ProgressBar renders track and fill', () => {
  const { container } = render(<ProgressBar value={3} max={5} label="3/5 reçus" />)
  expect(screen.getByText('3/5 reçus')).toBeTruthy()
  const fill = container.querySelectorAll('div')[1]
  expect(fill.style.width).toBe('60%')
})

test('ProgressBar clamps at 100%', () => {
  const { container } = render(<ProgressBar value={10} max={5} />)
  const fill = container.querySelectorAll('div')[1]
  expect(fill.style.width).toBe('100%')
})

test('ProgressBar with max=0 shows 0%', () => {
  const { container } = render(<ProgressBar value={0} max={0} />)
  const fill = container.querySelectorAll('div')[1]
  expect(fill.style.width).toBe('0%')
})
