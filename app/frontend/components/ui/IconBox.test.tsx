import { render } from '@testing-library/react'
import { PawPrint } from 'lucide-react'
import { IconBox } from './IconBox'

test('renders with correct size', () => {
  const { container } = render(
    <IconBox icon={PawPrint} color="#1B6B3A" bg="#d1fae5" size={48} />
  )
  const div = container.firstChild as HTMLElement
  expect(div.style.width).toBe('48px')
  expect(div.style.height).toBe('48px')
})

test('renders with default size 48', () => {
  const { container } = render(
    <IconBox icon={PawPrint} color="#1B6B3A" bg="#d1fae5" />
  )
  const div = container.firstChild as HTMLElement
  expect(div.style.width).toBe('48px')
})
