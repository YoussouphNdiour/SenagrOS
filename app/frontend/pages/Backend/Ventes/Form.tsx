import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import type { FormDataConvertible } from '@inertiajs/core'
import { ArrowLeft, Save } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import VenteItemsEditor from '../../../components/ventes/VenteItemsEditor'
import type { VentesFormProps, VenteItem } from '../../../types/vente'

function FieldError({ errors, field }: { errors: Record<string, string[]>; field: string }) {
  const msgs = errors[field]
  if (!msgs?.length) return null
  return <p className="mt-1 text-xs" style={{ color: '#dc2626' }}>{msgs[0]}</p>
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  borderRadius: '4px',
  padding: '8px 12px',
  fontSize: '14px',
  outline: 'none',
}

function VentesForm({ sale, natures, taxes, errors }: VentesFormProps) {
  const isEdit = sale.id !== null

  const [natureId, setNatureId] = useState<number | null>(sale.nature_id)
  const [clientName, setClientName] = useState(sale.client_name ?? '')
  const [clientId, setClientId] = useState<number | null>(sale.client_id)
  const [invoicedAt, setInvoicedAt] = useState(sale.invoiced_at ?? '')
  const [referenceNumber, setReferenceNumber] = useState(sale.reference_number ?? '')
  const [responsibleName, setResponsibleName] = useState(sale.responsible_name ?? '')
  const [responsibleId, setResponsibleId] = useState<number | null>(sale.responsible_id)
  const [description, setDescription] = useState(sale.description ?? '')
  const [items, setItems] = useState<VenteItem[]>(sale.items)

  const selectedNature = natures.find((n) => n.id === natureId)

  function buildItemsAttributes(): Array<{ [key: string]: FormDataConvertible }> {
    return items.map((item, index) => ({
      id:                    item.id ?? undefined,
      variant_name:          item.variant_name,
      conditioning_quantity: item.conditioning_quantity,
      unit_pretax_amount:    item.unit_pretax_amount,
      tax_id:                item.tax_id,
      reduction_percentage:  item.reduction_percentage,
      _destroy:              item._destroy ?? false,
      position:              index + 1,
    }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = {
      sale: {
        nature_id:        natureId,
        client_id:        clientId,
        invoiced_at:      invoicedAt || null,
        reference_number: referenceNumber || null,
        responsible_id:   responsibleId,
        description:      description || null,
        items_attributes: buildItemsAttributes(),
      },
    }
    if (isEdit) {
      router.patch(`/backend/sales/${sale.id}`, data)
    } else {
      router.post('/backend/sales', data)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <a href="/backend/sales" className="flex items-center gap-1 text-sm no-underline" style={{ color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={16} />
          Liste des ventes
        </a>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
          {isEdit ? `Modifier vente N°${sale.number}` : 'Nouvelle vente'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} noValidate aria-label="Formulaire vente">

        {/* Nature (only show selector if multiple natures) */}
        {natures.length > 1 && (
          <div
            className="rounded-lg p-5 mb-5"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--color-text-muted)' }}>Nature</h2>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Nature de vente <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={natureId ?? ''}
                onChange={(e) => setNatureId(parseInt(e.target.value) || null)}
                style={inputStyle}
              >
                <option value="">Sélectionner…</option>
                {natures.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
              <FieldError errors={errors} field="nature_id" />
            </div>
          </div>
        )}

        {/* Client + meta fields */}
        <div
          className="rounded-lg p-5 mb-5"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--color-text-muted)' }}>Informations</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Client */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Client <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value)
                  setClientId(null)
                }}
                placeholder="Nom du client"
                style={inputStyle}
              />
              {clientId && <input type="hidden" value={clientId} readOnly />}
              <FieldError errors={errors} field="client_id" />
            </div>

            {/* Reference */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Référence externe
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="ex. BON-2025-123"
                style={inputStyle}
              />
              <FieldError errors={errors} field="reference_number" />
            </div>

            {/* Invoiced at */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Date de facturation
              </label>
              <input
                type="date"
                value={invoicedAt}
                onChange={(e) => setInvoicedAt(e.target.value)}
                style={inputStyle}
              />
              <FieldError errors={errors} field="invoiced_at" />
            </div>

            {/* Responsible */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Responsable
              </label>
              <input
                type="text"
                value={responsibleName}
                onChange={(e) => {
                  setResponsibleName(e.target.value)
                  setResponsibleId(null)
                }}
                placeholder="Nom du responsable"
                style={inputStyle}
              />
              {responsibleId && <input type="hidden" value={responsibleId} readOnly />}
              <FieldError errors={errors} field="responsible_id" />
            </div>

            {/* Payment delay (read-only from nature) */}
            {selectedNature?.payment_delay && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                  Délai paiement
                </label>
                <input
                  type="text"
                  value={selectedNature.payment_delay}
                  readOnly
                  style={{ ...inputStyle, opacity: 0.7 }}
                />
              </div>
            )}

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="Informations complémentaires…"
              />
              <FieldError errors={errors} field="description" />
            </div>
          </div>
        </div>

        {/* Items */}
        <div
          className="rounded-lg p-5 mb-5"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Lignes de vente
          </h2>
          <VenteItemsEditor
            items={items}
            taxes={taxes}
            currency={selectedNature?.currency ?? sale.currency}
            onChange={setItems}
          />
          {errors.items && <p className="mt-2 text-xs" style={{ color: '#dc2626' }}>{errors.items[0]}</p>}
        </div>

        {/* Submit / Cancel */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            <Save size={15} />
            {isEdit ? 'Enregistrer' : 'Créer la vente'}
          </button>
          <a
            href={isEdit ? `/backend/sales/${sale.id}` : '/backend/sales'}
            className="px-4 py-2 rounded text-sm font-medium no-underline"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          >
            Annuler
          </a>
        </div>
      </form>
    </>
  )
}

VentesForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default VentesForm
