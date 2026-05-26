import { type ReactNode, useState } from 'react'
import { router } from '@inertiajs/react'
import type { FormDataConvertible } from '@inertiajs/core'
import { Save, Receipt, List } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { SectionCard, SectionTitle, FormField, PrimaryButton } from '../../../components/ui'
import AchatItemsEditor from '../../../components/achats/AchatItemsEditor'
import AchatsTabs from '../../../components/achats/AchatsTabs'
import type { FacturesFormProps, AchatItem } from '../../../types/achat'

export default function FacturesForm({ facture, natures, taxes, errors }: FacturesFormProps) {
  const isEdit = Boolean(facture.id)
  const [natureId, setNatureId] = useState(String(facture.nature_id ?? natures[0]?.id ?? ''))
  const [supplierName, setSupplierName] = useState(facture.supplier?.full_name ?? '')
  const [supplierId, setSupplierId] = useState(String(facture.supplier?.id ?? ''))
  const [invoicedAt, setInvoicedAt] = useState(facture.invoiced_at ?? '')
  const [referenceNumber, setReferenceNumber] = useState(facture.reference_number ?? '')
  const [paymentDelay, setPaymentDelay] = useState(facture.payment_delay ?? natures[0]?.payment_delay ?? '')
  const [responsibleName, setResponsibleName] = useState(facture.responsible_name ?? '')
  const [description, setDescription] = useState(facture.description ?? '')
  const [items, setItems] = useState<AchatItem[]>(facture.items ?? [])

  const currency = natures.find(n => String(n.id) === natureId)?.currency ?? facture.currency ?? 'XOF'

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
      'purchase_invoice[nature_id]':        natureId,
      'purchase_invoice[supplier_id]':      supplierId,
      'purchase_invoice[invoiced_at]':      invoicedAt,
      'purchase_invoice[reference_number]': referenceNumber,
      'purchase_invoice[payment_delay]':    paymentDelay,
      'purchase_invoice[description]':      description,
    }
    const itemsAttrs = buildItemsAttributes()
    Object.entries(itemsAttrs).forEach(([k, v]) => {
      data[`purchase_invoice[items_attributes][${k}]`] = v
    })
    if (isEdit) {
      router.patch(`/backend/purchase_invoices/${facture.id}`, data)
    } else {
      router.post('/backend/purchase_invoices', data)
    }
  }

  return (
    <div className="max-w-4xl">
      <AchatsTabs />

      <h1 className="text-[22px] font-bold mb-6" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
        {isEdit ? `Modifier la facture N° ${facture.number}` : 'Nouvelle facture'}
      </h1>

      <form aria-label="Formulaire facture" onSubmit={handleSubmit}>
        <SectionCard className="mb-5">
          <SectionTitle icon={Receipt}>Informations</SectionTitle>
          <div className="flex flex-col gap-5">
            {natures.length > 1 && (
              <FormField label="Nature" htmlFor="fac-nature" error={errors.nature_id?.[0]}>
                <select id="fac-nature" value={natureId} onChange={e => setNatureId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                  {natures.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </FormField>
            )}

            <FormField label="Fournisseur" required htmlFor="fac-supplier" error={errors.supplier_id?.[0]}>
              <input id="fac-supplier" type="text" value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                placeholder="Nom du fournisseur" required
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              <input type="hidden" value={supplierId} onChange={e => setSupplierId(e.target.value)} />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date facture" required htmlFor="fac-invoiced-at" error={errors.invoiced_at?.[0]}>
                <input id="fac-invoiced-at" type="date" value={invoicedAt} onChange={e => setInvoicedAt(e.target.value)} required
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>

              <FormField label="Référence fournisseur" htmlFor="fac-ref" error={errors.reference_number?.[0]}>
                <input id="fac-ref" type="text" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>

              <FormField label="Délai paiement" htmlFor="fac-delay">
                <input id="fac-delay" type="text" value={paymentDelay} onChange={e => setPaymentDelay(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>

              <FormField label="Responsable" htmlFor="fac-responsible">
                <input id="fac-responsible" type="text" value={responsibleName} onChange={e => setResponsibleName(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
            </div>

            <FormField label="Description" htmlFor="fac-description">
              <textarea id="fac-description" value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard className="mb-5">
          <SectionTitle icon={List}>Lignes de facture</SectionTitle>
          <AchatItemsEditor items={items} taxes={taxes} currency={currency} onChange={setItems} />
        </SectionCard>

        <div className="flex items-center gap-3">
          <PrimaryButton type="submit">
            <Save size={15} /> {isEdit ? 'Enregistrer' : 'Créer la facture'}
          </PrimaryButton>
          <PrimaryButton href="/backend/purchase_invoices" variant="secondary">Annuler</PrimaryButton>
        </div>
      </form>
    </div>
  )
}

FacturesForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
