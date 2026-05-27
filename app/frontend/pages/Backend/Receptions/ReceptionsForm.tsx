// app/frontend/pages/Backend/Receptions/ReceptionsForm.tsx
import { type ReactNode, useState } from 'react'
import { router } from '@inertiajs/react'
import type { FormDataConvertible } from '@inertiajs/core'
import { Save, Truck, List } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { SectionCard, SectionTitle, FormField, PrimaryButton, FlashBanner } from '../../../components/ui'
import AchatsTabs from '../../../components/achats/AchatsTabs'
import ReceptionItemsEditor from '../../../components/receptions/ReceptionItemsEditor'
import type { ReceptionsFormProps, ReceptionItem } from '../../../types/reception'

export default function ReceptionsForm({ reception, purchase_orders, errors }: ReceptionsFormProps) {
  const isEdit = Boolean(reception.id)
  const [supplierName, setSupplierName] = useState(reception.supplier?.full_name ?? '')
  const [senderId, setSenderId] = useState(String(reception.supplier?.id ?? ''))
  const [purchaseId, setPurchaseId] = useState(String(reception.purchase_order?.id ?? ''))
  const [plannedAt, setPlannedAt] = useState(reception.planned_at ?? '')
  const [givenAt, setGivenAt] = useState(reception.given_at ?? '')
  const [referenceNumber, setReferenceNumber] = useState(reception.reference_number ?? '')
  const [items, setItems] = useState<ReceptionItem[]>(reception.items ?? [])

  function buildItemsAttributes(): Record<string, FormDataConvertible> {
    const attrs: Record<string, FormDataConvertible> = {}
    items.forEach((item, i) => {
      attrs[`${i}[id]`]                    = String(item.id ?? '')
      attrs[`${i}[variant_name]`]          = item.variant_name ?? ''
      attrs[`${i}[conditioning_quantity]`] = String(item.conditioning_quantity)
      attrs[`${i}[unit_pretax_amount]`]    = String(item.unit_pretax_amount)
      attrs[`${i}[role]`]                  = item.role
      attrs[`${i}[non_compliant]`]         = item.non_compliant ? '1' : '0'
      attrs[`${i}[annotation]`]            = item.annotation ?? ''
      if (item._destroy) attrs[`${i}[_destroy]`] = '1'
    })
    return attrs
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: Record<string, FormDataConvertible> = {
      'reception[sender_id]':        senderId,
      'reception[purchase_id]':      purchaseId,
      'reception[planned_at]':       plannedAt,
      'reception[given_at]':         givenAt,
      'reception[reference_number]': referenceNumber,
    }
    const itemsAttrs = buildItemsAttributes()
    Object.entries(itemsAttrs).forEach(([k, v]) => {
      data[`reception[items_attributes][${k}]`] = v
    })
    if (isEdit) {
      router.patch(`/backend/receptions/${reception.id}`, data)
    } else {
      router.post('/backend/receptions', data)
    }
  }

  return (
    <div className="max-w-4xl">
      <AchatsTabs />

      <h1 className="text-[22px] font-bold mb-6" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
        {isEdit ? `Modifier la réception N° ${reception.number}` : 'Nouvelle réception'}
      </h1>

      <FlashBanner errors={errors} />

      <form aria-label="Formulaire réception" onSubmit={handleSubmit}>
        <SectionCard className="mb-5">
          <SectionTitle icon={Truck}>Informations</SectionTitle>
          <div className="flex flex-col gap-5">
            <FormField label="Fournisseur" required htmlFor="rec-supplier" error={errors.sender_id?.[0]}>
              <input id="rec-supplier" type="text" value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                placeholder="Nom du fournisseur" required
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              <input type="hidden" value={senderId} onChange={e => setSenderId(e.target.value)} />
            </FormField>

            <FormField label="Commande liée" htmlFor="rec-purchase" error={errors.purchase_id?.[0]}>
              <select id="rec-purchase" value={purchaseId} onChange={e => setPurchaseId(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                <option value="">— Aucune —</option>
                {purchase_orders.map(po => (
                  <option key={po.id} value={po.id}>{po.number}</option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date prévue" required htmlFor="rec-planned-at" error={errors.planned_at?.[0]}>
                <input id="rec-planned-at" type="date" value={plannedAt} onChange={e => setPlannedAt(e.target.value)} required
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>

              <FormField label="Date de réception" required htmlFor="rec-given-at" error={errors.given_at?.[0]}>
                <input id="rec-given-at" type="date" value={givenAt} onChange={e => setGivenAt(e.target.value)} required
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
            </div>

            <FormField label="Référence" htmlFor="rec-ref" error={errors.reference_number?.[0]}>
              <input id="rec-ref" type="text" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard className="mb-5">
          <SectionTitle icon={List}>Lignes de réception</SectionTitle>
          <ReceptionItemsEditor items={items} onChange={setItems} />
        </SectionCard>

        <div className="flex items-center gap-3">
          <PrimaryButton type="submit">
            <Save size={15} /> {isEdit ? 'Enregistrer' : 'Créer la réception'}
          </PrimaryButton>
          <PrimaryButton href="/backend/receptions" variant="secondary">Annuler</PrimaryButton>
        </div>
      </form>
    </div>
  )
}

ReceptionsForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
