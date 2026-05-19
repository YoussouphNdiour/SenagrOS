import { Plus, Trash2 } from 'lucide-react'
import type { VenteItem, VenteTax } from '../../types/vente'

interface VenteItemsEditorProps {
  items: VenteItem[]
  taxes: VenteTax[]
  currency: string
  onChange: (items: VenteItem[]) => void
}

function calcAmounts(item: VenteItem): { pretax_amount: number; amount: number } {
  const pretax_amount =
    item.conditioning_quantity * item.unit_pretax_amount * (1 - item.reduction_percentage / 100)
  const amount = pretax_amount * (1 + item.tax_rate)
  return {
    pretax_amount: Math.round(pretax_amount * 100) / 100,
    amount: Math.round(amount * 100) / 100,
  }
}

function emptyItem(): VenteItem {
  return {
    id: null,
    variant_id: null,
    variant_name: '',
    conditioning_unit_id: null,
    conditioning_unit_name: null,
    conditioning_quantity: 1,
    unit_pretax_amount: 0,
    tax_id: null,
    tax_rate: 0,
    reduction_percentage: 0,
    pretax_amount: 0,
    amount: 0,
    label: null,
    annotation: null,
  }
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('fr-SN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  borderRadius: '4px',
  padding: '4px 6px',
  fontSize: '13px',
  outline: 'none',
}

export default function VenteItemsEditor({ items, taxes, currency, onChange }: VenteItemsEditorProps) {
  function update(index: number, patch: Partial<VenteItem>) {
    const updated = items.map((item, i) => {
      if (i !== index) return item
      const merged = { ...item, ...patch }
      const amounts = calcAmounts(merged)
      return { ...merged, ...amounts }
    })
    onChange(updated)
  }

  function addRow() {
    onChange([...items, emptyItem()])
  }

  function removeRow(index: number) {
    const item = items[index]
    if (item.id !== null) {
      onChange(items.map((it, i) => (i === index ? { ...it, _destroy: true } : it)))
    } else {
      onChange(items.filter((_, i) => i !== index))
    }
  }

  const visible = items.filter((item) => !item._destroy)
  const totalHT = visible.reduce((sum, item) => sum + item.pretax_amount, 0)
  const totalTTC = visible.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: 'var(--color-bg)' }}>
              {['Produit', 'Qté', 'PU HT', 'TVA', 'Remise %', 'HT', 'TTC', ''].map((h) => (
                <th
                  key={h}
                  className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--color-text-muted)', borderBottom: '2px solid var(--color-border)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              if (item._destroy) return null
              return (
                <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.variant_name ?? ''}
                      onChange={(e) => update(index, { variant_name: e.target.value })}
                      placeholder="Nom produit"
                      style={inputStyle}
                    />
                  </td>
                  <td className="px-2 py-2" style={{ width: '80px' }}>
                    <input
                      type="number"
                      value={item.conditioning_quantity}
                      min={0}
                      step="any"
                      onChange={(e) => update(index, { conditioning_quantity: parseFloat(e.target.value) || 0 })}
                      style={inputStyle}
                    />
                  </td>
                  <td className="px-2 py-2" style={{ width: '100px' }}>
                    <input
                      type="number"
                      value={item.unit_pretax_amount}
                      min={0}
                      step="any"
                      onChange={(e) => update(index, { unit_pretax_amount: parseFloat(e.target.value) || 0 })}
                      style={inputStyle}
                    />
                  </td>
                  <td className="px-2 py-2" style={{ width: '100px' }}>
                    <select
                      value={item.tax_id ?? ''}
                      onChange={(e) => {
                        const tax = taxes.find((t) => t.id === parseInt(e.target.value))
                        update(index, { tax_id: tax?.id ?? null, tax_rate: tax?.amount ?? 0 })
                      }}
                      style={inputStyle}
                    >
                      <option value="">—</option>
                      {taxes.map((t) => (
                        <option key={t.id} value={t.id}>{t.short_label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2" style={{ width: '80px' }}>
                    <input
                      type="number"
                      value={item.reduction_percentage}
                      min={0}
                      max={100}
                      step="any"
                      onChange={(e) => update(index, { reduction_percentage: parseFloat(e.target.value) || 0 })}
                      style={inputStyle}
                    />
                  </td>
                  <td className="px-2 py-2 text-right font-medium" style={{ color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                    {formatAmount(item.pretax_amount, currency)}
                  </td>
                  <td className="px-2 py-2 text-right font-medium" style={{ color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                    {formatAmount(item.amount, currency)}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      aria-label="Supprimer"
                      onClick={() => removeRow(index)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '2px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--color-bg)', borderTop: '2px solid var(--color-border)' }}>
              <td colSpan={5} className="px-2 py-2 text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Total
              </td>
              <td className="px-2 py-2 text-right font-bold" style={{ color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                {formatAmount(totalHT, currency)}
              </td>
              <td className="px-2 py-2 text-right font-bold" style={{ color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                {formatAmount(totalTTC, currency)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="mt-3">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-2 px-3 py-2 rounded text-sm"
          style={{
            border: '1px dashed var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          Ajouter une ligne
        </button>
      </div>
    </div>
  )
}
