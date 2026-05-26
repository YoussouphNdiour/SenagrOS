import { render, screen } from '@testing-library/react'
import { Beef } from 'lucide-react'
import { SectionCard } from './SectionCard'
import { SectionTitle } from './SectionTitle'

test('SectionCard renders children', () => {
  render(<SectionCard><p>contenu</p></SectionCard>)
  expect(screen.getByText('contenu')).toBeTruthy()
})

test('SectionCard with noPadding has no padding class', () => {
  const { container } = render(<SectionCard noPadding><p>x</p></SectionCard>)
  expect(container.firstChild).not.toHaveClass('p-6')
})

test('SectionTitle renders text and icon', () => {
  const { container } = render(<SectionTitle icon={Beef}>Informations</SectionTitle>)
  expect(screen.getByText('Informations')).toBeTruthy()
  expect(container.querySelector('svg')).toBeTruthy()
})
