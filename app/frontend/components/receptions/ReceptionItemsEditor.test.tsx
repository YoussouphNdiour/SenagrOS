import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ReceptionItemsEditor from './ReceptionItemsEditor'
import type { ReceptionItem } from '../../types/reception'

const baseItem: ReceptionItem = {
  id: 1,
  variant_name: 'Semences mil',
  conditioning_quantity: 10,
  unit_pretax_amount: 500,
  role: 'merchandise',
  non_compliant: false,
  annotation: null,
  purchase_invoice_item_id: null,
}

const newItem: ReceptionItem = {
  id: null,
  variant_name: 'Engrais NPK',
  conditioning_quantity: 5,
  unit_pretax_amount: 1000,
  role: 'fees',
  non_compliant: true,
  annotation: 'Commentaire',
  purchase_invoice_item_id: null,
}

describe('ReceptionItemsEditor', () => {
  it('renders existing row data', () => {
    const onChange = vi.fn()
    render(<ReceptionItemsEditor items={[baseItem]} onChange={onChange} />)
    expect(screen.getByDisplayValue('Semences mil')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    expect(screen.getByDisplayValue('500')).toBeInTheDocument()
  })

  it('shows totals row', () => {
    const onChange = vi.fn()
    render(<ReceptionItemsEditor items={[baseItem, newItem]} onChange={onChange} />)
    // 10×500 + 5×1000 = 10000
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'td' && /10.000,00/.test(content)
    })).toBeInTheDocument()
  })

  it('add button calls onChange with new empty row', () => {
    const onChange = vi.fn()
    render(<ReceptionItemsEditor items={[baseItem]} onChange={onChange} />)
    fireEvent.click(screen.getByText(/ajouter/i))
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: null, conditioning_quantity: 1, unit_pretax_amount: 0 })
      ])
    )
  })

  it('remove persisted row sets _destroy: true', () => {
    const onChange = vi.fn()
    render(<ReceptionItemsEditor items={[baseItem]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }))
    expect(onChange).toHaveBeenCalledWith([{ ...baseItem, _destroy: true }])
  })

  it('remove new row splices the array', () => {
    const onChange = vi.fn()
    render(<ReceptionItemsEditor items={[newItem]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('qty change updates totals', () => {
    const onChange = vi.fn()
    const { rerender } = render(<ReceptionItemsEditor items={[baseItem]} onChange={onChange} />)
    const qtyInput = screen.getAllByRole('spinbutton')[0]
    fireEvent.change(qtyInput, { target: { value: '20' } })
    // onChange is called; simulate controlled update
    rerender(<ReceptionItemsEditor items={[{ ...baseItem, conditioning_quantity: 20 }]} onChange={onChange} />)
    // 20×500 = 10000
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'td' && /10.000,00/.test(content)
    })).toBeInTheDocument()
  })
})
