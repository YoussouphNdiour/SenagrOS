// app/frontend/pages/Backend/Achats/CommandesForm.tsx
import { type ReactNode, useState } from 'react'
import { router } from '@inertiajs/react'
import type { FormDataConvertible } from '@inertiajs/core'
import { AppShell } from '../../../components/AppShell'
import AchatItemsEditor from '../../../components/achats/AchatItemsEditor'
import AchatsTabs from '../../../components/achats/AchatsTabs'
import type { CommandesFormProps, AchatItem } from '../../../types/achat'

function FieldError({ errors, field }: { errors: Record<string, string[]>; field: string }) {
  const messages = errors[field]
  if (!messages?.length) return null
  return <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>{messages[0]}</p>
}

export default function CommandesForm({ commande, natures, taxes, errors }: CommandesFormProps) {
  const isEdit = Boolean(commande.id)
  const [natureId, setNatureId] = useState(String(natures[0]?.id ?? ''))
  const [supplierName, setSupplierName] = useState(commande.supplier?.full_name ?? '')
  const [supplierId, setSupplierId] = useState(String(commande.supplier?.id ?? ''))
  const [orderedAt, setOrderedAt] = useState(commande.ordered_at ?? '')
  const [referenceNumber, setReferenceNumber] = useState(commande.reference_number ?? '')
  const [responsibleName, setResponsibleName] = useState(commande.responsible_name ?? '')
  const [description, setDescription] = useState(commande.description ?? '')
  const [items, setItems] = useState<AchatItem[]>(commande.items ?? [])

  const currency = natures.find(n => String(n.id) === natureId)?.currency ?? commande.currency ?? 'XOF'

  function buildItemsAttributes(): Record<string, FormDataConvertible> {
    const attrs: Record<string, FormDataConvertible> = {}
    items.forEach((item, i) => {
      attrs[`${i}[id]`]                    = String(item.id ?? '')
      attrs[`${i}[variant_name]`]          = item.variant_name ?? ''
      attrs[`${i}[conditioning_quantity]`] = String(item.conditioning_quantity)
      attrs[`${i}[unit_pretax_amount]`]    = String(item.unit_pretax_amount)
      attrs[`${i}[tax_id]`]               = String(item.tax_id ?? '')
      attrs[`${i}[reduction_percentage]`]  = String(item.reduction_percentage)
      if (item._destroy) attrs[`${i}[_destroy]`] = '1'
    })
    return attrs
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: Record<string, FormDataConvertible> = {
      'purchase_order[nature_id]':        natureId,
      'purchase_order[supplier_id]':      supplierId,
      'purchase_order[ordered_at]':       orderedAt,
      'purchase_order[reference_number]': referenceNumber,
      'purchase_order[description]':      description,
    }
    const itemsAttrs = buildItemsAttributes()
    Object.entries(itemsAttrs).forEach(([k, v]) => {
      data[`purchase_order[items_attributes][${k}]`] = v
    })
    if (isEdit) {
      router.patch(`/backend/purchase_orders/${commande.id}`, data)
    } else {
      router.post('/backend/purchase_orders', data)
    }
  }

  const label: React.CSSProperties = { display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.375rem' }
  const inp: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', fontSize: '0.9375rem', boxSizing: 'border-box' }
  const fieldStyle: React.CSSProperties = { marginBottom: '1.25rem' }
  const card: React.CSSProperties = { background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', padding: '1.5rem', marginBottom: '1.25rem' }

  return (
    <div style={{ padding: '2rem', maxWidth: '860px' }}>
      <AchatsTabs />
      <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1.5rem' }}>
        {isEdit ? `Modifier la commande ${commande.number}` : 'Nouvelle commande'}
      </h1>

      <form aria-label="Formulaire commande" onSubmit={handleSubmit}>
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {natures.length > 1 && (
              <div style={fieldStyle}>
                <label style={label}>Nature</label>
                <select value={natureId} onChange={e => setNatureId(e.target.value)} style={inp}>
                  {natures.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
                <FieldError errors={errors} field="nature" />
              </div>
            )}

            <div style={fieldStyle}>
              <label style={label}>Fournisseur</label>
              <input
                style={inp}
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                placeholder="Nom du fournisseur"
                required
              />
              <input type="hidden" value={supplierId} onChange={e => setSupplierId(e.target.value)} />
              <FieldError errors={errors} field="supplier" />
            </div>

            <div style={fieldStyle}>
              <label style={label}>Date commande *</label>
              <input type="date" style={inp} value={orderedAt} onChange={e => setOrderedAt(e.target.value)} required />
              <FieldError errors={errors} field="ordered_at" />
            </div>

            <div style={fieldStyle}>
              <label style={label}>Référence fournisseur</label>
              <input style={inp} value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} />
              <FieldError errors={errors} field="reference_number" />
            </div>

            <div style={fieldStyle}>
              <label style={label}>Responsable</label>
              <input style={inp} value={responsibleName} onChange={e => setResponsibleName(e.target.value)} />
            </div>

            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <label style={label}>Description</label>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: '80px' }} value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text)' }}>Lignes de commande</h2>
          <AchatItemsEditor items={items} taxes={taxes} currency={currency} onChange={setItems} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9375rem' }}>
            {isEdit ? 'Enregistrer' : 'Créer la commande'}
          </button>
          <a href="/backend/purchase_orders" style={{ textDecoration: 'none' }}>
            <button type="button" style={{ background: 'var(--color-bg-card)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', cursor: 'pointer', fontSize: '0.9375rem' }}>
              Annuler
            </button>
          </a>
        </div>
      </form>
    </div>
  )
}

CommandesForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
