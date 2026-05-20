// app/frontend/components/achats/AchatItemsEditor.tsx
import { Trash2, Plus } from 'lucide-react'
import type { AchatItem, AchatTax } from '../../types/achat'

interface Props {
  items: AchatItem[]
  taxes: AchatTax[]
  currency: string
  onChange: (items: AchatItem[]) => void
}

function calcAmounts(item: AchatItem, taxes: AchatTax[]): AchatItem {
  const pretax = Math.round(
    item.conditioning_quantity * item.unit_pretax_amount * (1 - item.reduction_percentage / 100) * 100
  ) / 100
  const tax = taxes.find(t => t.id === item.tax_id)
  const amount = Math.round(pretax * (1 + (tax?.amount ?? 0)) * 100) / 100
  return { ...item, pretax_amount: pretax, amount }
}

function emptyItem(): AchatItem {
  return {
    id: null,
    variant_name: null,
    conditioning_quantity: 1,
    unit_pretax_amount: 0,
    tax_id: null,
    reduction_percentage: 0,
    pretax_amount: 0,
    amount: 0,
  }
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function AchatItemsEditor({ items, taxes, currency, onChange }: Props) {
  const visible = items.filter(i => !i._destroy)

  function update(index: number, patch: Partial<AchatItem>) {
    const updated = items.map((item, i) => {
      if (i !== index) return item
      return calcAmounts({ ...item, ...patch }, taxes)
    })
    onChange(updated)
  }

  function addRow() {
    onChange([...items, emptyItem()])
  }

  function removeRow(index: number) {
    const item = items[index]
    if (item.id !== null) {
      onChange(items.map((it, i) => i === index ? { ...it, _destroy: true } : it))
    } else {
      onChange(items.filter((_, i) => i !== index))
    }
  }

  const totalPretax = visible.reduce((s, i) => s + i.pretax_amount, 0)
  const totalAmount = visible.reduce((s, i) => s + i.amount, 0)

  const cell: React.CSSProperties = { padding: '0.5rem', border: '1px solid var(--color-border)' }
  const th: React.CSSProperties = { ...cell, background: 'var(--color-bg-subtle)', fontWeight: 600, fontSize: '0.875rem' }
  const input: React.CSSProperties = { width: '100%', padding: '0.25rem 0.375rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem', fontSize: '0.875rem' }

  // currency prop reserved for future formatting use
  void currency

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.75rem' }}>
        <thead>
          <tr>
            <th style={th}>Désignation</th>
            <th style={{ ...th, width: '80px' }}>Qté</th>
            <th style={{ ...th, width: '110px' }}>PU HT</th>
            <th style={{ ...th, width: '90px' }}>Taxe</th>
            <th style={{ ...th, width: '80px' }}>Rem. %</th>
            <th style={{ ...th, width: '100px', textAlign: 'right' }}>HT</th>
            <th style={{ ...th, width: '100px', textAlign: 'right' }}>TTC</th>
            <th style={{ ...th, width: '40px' }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            if (item._destroy) return null
            return (
              <tr key={item.id !== null ? `persisted-${item.id}` : `new-${index}`}>
                <td style={cell}>
                  <input
                    style={input}
                    value={item.variant_name ?? ''}
                    onChange={e => update(index, { variant_name: e.target.value })}
                  />
                </td>
                <td style={cell}>
                  <input
                    style={input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.conditioning_quantity}
                    onChange={e => update(index, { conditioning_quantity: parseFloat(e.target.value) || 0 })}
                  />
                </td>
                <td style={cell}>
                  <input
                    style={input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_pretax_amount}
                    onChange={e => update(index, { unit_pretax_amount: parseFloat(e.target.value) || 0 })}
                  />
                </td>
                <td style={cell}>
                  <select
                    style={input}
                    value={item.tax_id ?? ''}
                    onChange={e => update(index, { tax_id: e.target.value ? parseInt(e.target.value) : null })}
                  >
                    <option value="">—</option>
                    {taxes.map(t => (
                      <option key={t.id} value={t.id}>{t.short_label}</option>
                    ))}
                  </select>
                </td>
                <td style={cell}>
                  <input
                    style={input}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={item.reduction_percentage}
                    onChange={e => update(index, { reduction_percentage: parseFloat(e.target.value) || 0 })}
                  />
                </td>
                <td style={{ ...cell, textAlign: 'right', fontSize: '0.875rem' }}>{item.pretax_amount}</td>
                <td style={{ ...cell, textAlign: 'right', fontSize: '0.875rem' }}>{item.amount}</td>
                <td style={cell}>
                  <button
                    type="button"
                    aria-label="Supprimer"
                    onClick={() => removeRow(index)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.25rem' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid var(--color-border)', fontWeight: 600 }}>
            <td colSpan={5} style={{ ...cell, textAlign: 'right', fontSize: '0.875rem' }}>Total</td>
            <td style={{ ...cell, textAlign: 'right' }}>{fmt(totalPretax)}</td>
            <td style={{ ...cell, textAlign: 'right' }}>{fmt(totalAmount)}</td>
            <td style={cell}></td>
          </tr>
        </tfoot>
      </table>
      <button
        type="button"
        onClick={addRow}
        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', background: 'var(--color-bg-card)', cursor: 'pointer', fontSize: '0.875rem' }}
      >
        <Plus size={14} /> Ajouter une ligne
      </button>
    </div>
  )
}
