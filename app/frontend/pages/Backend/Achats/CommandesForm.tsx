// app/frontend/pages/Backend/Achats/CommandesForm.tsx
import { type ReactNode, useState } from 'react'
import { router } from '@inertiajs/react'
import type { FormDataConvertible } from '@inertiajs/core'
import { Save, ShoppingBag, List } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { SectionCard, SectionTitle, FormField, PrimaryButton, FlashBanner } from '../../../components/ui'
import AchatItemsEditor from '../../../components/achats/AchatItemsEditor'
import AchatsTabs from '../../../components/achats/AchatsTabs'
import type { CommandesFormProps, AchatItem } from '../../../types/achat'

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

  return (
    <div className="max-w-4xl">
      <AchatsTabs />

      <h1 className="text-[22px] font-bold mb-6" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
        {isEdit ? `Modifier la commande ${commande.number}` : 'Nouvelle commande'}
      </h1>

      <FlashBanner errors={errors} />

      <form aria-label="Formulaire commande" onSubmit={handleSubmit}>
        <SectionCard className="mb-5">
          <SectionTitle icon={ShoppingBag}>Informations</SectionTitle>
          <div className="flex flex-col gap-5">
            {natures.length > 1 && (
              <FormField label="Nature" htmlFor="cmd-nature" error={errors.nature?.[0]}>
                <select id="cmd-nature" value={natureId} onChange={e => setNatureId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                  {natures.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </FormField>
            )}

            <FormField label="Fournisseur" required htmlFor="cmd-supplier" error={errors.supplier?.[0]}>
              <input id="cmd-supplier" type="text" value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                placeholder="Nom du fournisseur" required
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              <input type="hidden" value={supplierId} onChange={e => setSupplierId(e.target.value)} />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date commande" required htmlFor="cmd-ordered-at" error={errors.ordered_at?.[0]}>
                <input id="cmd-ordered-at" type="date" value={orderedAt} onChange={e => setOrderedAt(e.target.value)} required
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>

              <FormField label="Référence fournisseur" htmlFor="cmd-ref" error={errors.reference_number?.[0]}>
                <input id="cmd-ref" type="text" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
            </div>

            <FormField label="Responsable" htmlFor="cmd-responsible">
              <input id="cmd-responsible" type="text" value={responsibleName} onChange={e => setResponsibleName(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </FormField>

            <FormField label="Description" htmlFor="cmd-description">
              <textarea id="cmd-description" value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard className="mb-5">
          <SectionTitle icon={List}>Lignes de commande</SectionTitle>
          <AchatItemsEditor items={items} taxes={taxes} currency={currency} onChange={setItems} />
        </SectionCard>

        <div className="flex items-center gap-3">
          <PrimaryButton type="submit">
            <Save size={15} /> {isEdit ? 'Enregistrer' : 'Créer la commande'}
          </PrimaryButton>
          <PrimaryButton href="/backend/purchase_orders" variant="secondary">Annuler</PrimaryButton>
        </div>
      </form>
    </div>
  )
}

CommandesForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
