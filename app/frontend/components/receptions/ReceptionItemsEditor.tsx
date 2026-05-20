import { Trash2, Plus } from 'lucide-react'
import type { ReceptionItem, ReceptionItemRole } from '../../types/reception'

interface Props {
  items: ReceptionItem[]
  onChange: (items: ReceptionItem[]) => void
}

const ROLE_OPTIONS: { value: ReceptionItemRole; label: string }[] = [
  { value: 'merchandise', label: 'Marchandise' },
  { value: 'fees',        label: 'Frais' },
  { value: 'service',     label: 'Service' },
]

function emptyItem(): ReceptionItem {
  return {
    id: null,
    variant_name: null,
    conditioning_quantity: 1,
    unit_pretax_amount: 0,
    role: 'merchandise',
    non_compliant: false,
    annotation: null,
    purchase_invoice_item_id: null,
  }
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ReceptionItemsEditor({ items, onChange }: Props) {
  const visible = items.filter(i => !i._destroy)

  function update(index: number, patch: Partial<ReceptionItem>) {
    onChange(items.map((item, i) => i !== index ? item : { ...item, ...patch }))
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

  const total = visible.reduce((s, i) => s + i.conditioning_quantity * i.unit_pretax_amount, 0)

  const cell: React.CSSProperties = { padding: '0.5rem', border: '1px solid var(--color-border)' }
  const th: React.CSSProperties = { ...cell, background: 'var(--color-bg-subtle)', fontWeight: 600, fontSize: '0.875rem' }
  const input: React.CSSProperties = { width: '100%', padding: '0.25rem 0.375rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem', fontSize: '0.875rem' }

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.75rem' }}>
        <thead>
          <tr>
            <th style={th}>Désignation</th>
            <th style={{ ...th, width: '80px' }}>Qté</th>
            <th style={{ ...th, width: '110px' }}>PU HT</th>
            <th style={{ ...th, width: '110px' }}>Rôle</th>
            <th style={{ ...th, width: '80px', textAlign: 'center' }}>Non conf.</th>
            <th style={th}>Annotation</th>
            <th style={{ ...th, width: '100px', textAlign: 'right' }}>HT</th>
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
                    value={item.role}
                    onChange={e => update(index, { role: e.target.value as ReceptionItemRole })}
                  >
                    {ROLE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </td>
                <td style={{ ...cell, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={item.non_compliant}
                    onChange={e => update(index, { non_compliant: e.target.checked })}
                  />
                </td>
                <td style={cell}>
                  <input
                    style={input}
                    value={item.annotation ?? ''}
                    onChange={e => update(index, { annotation: e.target.value || null })}
                  />
                </td>
                <td style={{ ...cell, textAlign: 'right', fontSize: '0.875rem' }}>
                  {item.conditioning_quantity * item.unit_pretax_amount}
                </td>
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
            <td colSpan={6} style={{ ...cell, textAlign: 'right', fontSize: '0.875rem' }}>Total HT</td>
            <td style={{ ...cell, textAlign: 'right' }}>{fmt(total)}</td>
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
