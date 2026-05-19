import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import VenteItemsEditor from './VenteItemsEditor'
import type { VenteItem, VenteTax } from '../../types/vente'

const taxes: VenteTax[] = [
  { id: 1, name: 'TVA 18%', short_label: '18%', amount: 0.18 },
  { id: 2, name: 'Exonéré', short_label: '0%', amount: 0.0 },
]

const makeItem = (overrides: Partial<VenteItem> = {}): VenteItem => ({
  id: null,
  variant_id: null,
  variant_name: 'Mil',
  conditioning_unit_id: null,
  conditioning_unit_name: null,
  conditioning_quantity: 10,
  unit_pretax_amount: 1000,
  tax_id: 1,
  tax_rate: 0.18,
  reduction_percentage: 0,
  pretax_amount: 10000,
  amount: 11800,
  label: null,
  annotation: null,
  ...overrides,
})

describe('VenteItemsEditor', () => {
  it('renders an existing item row', () => {
    const onChange = vi.fn()
    render(<VenteItemsEditor items={[makeItem()]} taxes={taxes} currency="XOF" onChange={onChange} />)
    expect(screen.getByDisplayValue('Mil')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
  })

  it('renders totals row', () => {
    render(<VenteItemsEditor items={[makeItem()]} taxes={taxes} currency="XOF" onChange={vi.fn()} />)
    expect(screen.getByText(/Total/i)).toBeInTheDocument()
  })

  it('add item button calls onChange with one more row', () => {
    const onChange = vi.fn()
    render(<VenteItemsEditor items={[]} taxes={taxes} currency="XOF" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /Ajouter/i }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange.mock.calls[0][0]).toHaveLength(1)
  })

  it('remove button marks existing item _destroy=true', () => {
    const onChange = vi.fn()
    const item = makeItem({ id: 42 })
    render(<VenteItemsEditor items={[item]} taxes={taxes} currency="XOF" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/i }))
    expect(onChange).toHaveBeenCalledWith([{ ...item, _destroy: true }])
  })

  it('remove button removes new item (id=null) from array', () => {
    const onChange = vi.fn()
    const item = makeItem({ id: null })
    render(<VenteItemsEditor items={[item]} taxes={taxes} currency="XOF" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/i }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('recalculates pretax_amount and amount when qty changes', () => {
    const onChange = vi.fn()
    render(<VenteItemsEditor items={[makeItem()]} taxes={taxes} currency="XOF" onChange={onChange} />)
    // Change conditioning_quantity from 10 to 5
    const qtyInput = screen.getByDisplayValue('10')
    fireEvent.change(qtyInput, { target: { value: '5' } })
    expect(onChange).toHaveBeenCalledOnce()
    const updatedItem = onChange.mock.calls[0][0][0]
    // pretax_amount = 5 * 1000 * (1 - 0/100) = 5000
    expect(updatedItem.pretax_amount).toBe(5000)
    // amount = 5000 * (1 + 0.18) = 5900
    expect(updatedItem.amount).toBe(5900)
  })
})
