// app/frontend/components/achats/AchatItemsEditor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import AchatItemsEditor from './AchatItemsEditor'
import type { AchatItem, AchatTax } from '../../types/achat'

const taxes: AchatTax[] = [
  { id: 1, name: 'TVA 18%', short_label: '18%', amount: 0.18 },
]

const baseItem: AchatItem = {
  id: 1,
  variant_name: 'Semences mil',
  conditioning_quantity: 10,
  unit_pretax_amount: 500,
  tax_id: 1,
  reduction_percentage: 0,
  pretax_amount: 5000,
  amount: 5900,
}

const newItem: AchatItem = {
  id: null,
  variant_name: 'Engrais NPK',
  conditioning_quantity: 5,
  unit_pretax_amount: 1000,
  tax_id: 1,
  reduction_percentage: 0,
  pretax_amount: 5000,
  amount: 5900,
}

describe('AchatItemsEditor', () => {
  it('renders existing row data', () => {
    render(<AchatItemsEditor items={[baseItem]} taxes={taxes} currency="XOF" onChange={() => {}} />)
    expect(screen.getByDisplayValue('Semences mil')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
  })

  it('shows totals row', () => {
    render(<AchatItemsEditor items={[baseItem]} taxes={taxes} currency="XOF" onChange={() => {}} />)
    expect(screen.getByText('5 000,00')).toBeInTheDocument()
    expect(screen.getByText('5 900,00')).toBeInTheDocument()
  })

  it('add button calls onChange with a new empty row appended', () => {
    const onChange = vi.fn()
    render(<AchatItemsEditor items={[baseItem]} taxes={taxes} currency="XOF" onChange={onChange} />)
    fireEvent.click(screen.getByText('Ajouter une ligne'))
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: null, variant_name: null }),
      ])
    )
  })

  it('remove persisted row sets _destroy: true', () => {
    const onChange = vi.fn()
    render(<AchatItemsEditor items={[baseItem]} taxes={taxes} currency="XOF" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }))
    expect(onChange).toHaveBeenCalledWith([{ ...baseItem, _destroy: true }])
  })

  it('remove new row splices it from the array', () => {
    const onChange = vi.fn()
    render(<AchatItemsEditor items={[newItem]} taxes={taxes} currency="XOF" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('qty change recalculates pretax_amount and amount', () => {
    const onChange = vi.fn()
    render(<AchatItemsEditor items={[baseItem]} taxes={taxes} currency="XOF" onChange={onChange} />)
    fireEvent.change(screen.getByDisplayValue('10'), { target: { value: '20' } })
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ conditioning_quantity: 20, pretax_amount: 10000, amount: 11800 }),
    ])
  })
})
