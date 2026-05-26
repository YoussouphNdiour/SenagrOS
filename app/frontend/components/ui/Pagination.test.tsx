import { render, screen, fireEvent } from '@testing-library/react'
import { List } from 'lucide-react'
import { Pagination } from './Pagination'
import { ViewToggle } from './ViewToggle'
import { FilterBar } from './FilterBar'
import { describe, test, expect, vi } from 'vitest'

describe('Pagination', () => {
  test('renders page info', () => {
    render(<Pagination page={2} totalPages={5} total={48} onPrev={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByText(/page 2 sur 5/i)).toBeTruthy()
    expect(screen.getByText(/48 résultats/i)).toBeTruthy()
  })

  test('calls onPrev', () => {
    const onPrev = vi.fn()
    render(<Pagination page={2} totalPages={5} total={48} onPrev={onPrev} onNext={vi.fn()} />)
    fireEvent.click(screen.getByText(/précédent/i))
    expect(onPrev).toHaveBeenCalledOnce()
  })

  test('calls onNext', () => {
    const onNext = vi.fn()
    render(<Pagination page={2} totalPages={5} total={48} onPrev={vi.fn()} onNext={onNext} />)
    fireEvent.click(screen.getByText(/suivant/i))
    expect(onNext).toHaveBeenCalledOnce()
  })

  test('disables Précédent on first page', () => {
    render(<Pagination page={1} totalPages={5} total={48} onPrev={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByText(/précédent/i).closest('button')).toBeDisabled()
  })

  test('disables Suivant on last page', () => {
    render(<Pagination page={5} totalPages={5} total={48} onPrev={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByText(/suivant/i).closest('button')).toBeDisabled()
  })
})

describe('ViewToggle', () => {
  test('renders views and calls onChange', () => {
    const onChange = vi.fn()
    render(
      <ViewToggle
        views={[{ key: 'list', label: 'Liste', icon: List }]}
        active="list"
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByText('Liste'))
    expect(onChange).toHaveBeenCalledWith('list')
  })

  test('highlights active view', () => {
    render(
      <ViewToggle
        views={[
          { key: 'list', label: 'Liste', icon: List },
          { key: 'grid', label: 'Grille', icon: List },
        ]}
        active="list"
        onChange={vi.fn()}
      />
    )
    const listButton = screen.getByText('Liste').closest('button')
    expect(listButton).toHaveStyle({ borderColor: 'var(--color-primary)' })
  })
})

describe('FilterBar', () => {
  test('renders children', () => {
    render(<FilterBar><input placeholder="Chercher" /></FilterBar>)
    expect(screen.getByPlaceholderText('Chercher')).toBeTruthy()
  })

  test('renders multiple children', () => {
    render(
      <FilterBar>
        <input placeholder="Chercher" />
        <select><option>Filtrer</option></select>
      </FilterBar>
    )
    expect(screen.getByPlaceholderText('Chercher')).toBeTruthy()
    expect(screen.getByRole('combobox')).toBeTruthy()
  })
})
