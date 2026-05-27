import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import type { FormDataConvertible } from '@inertiajs/core'
import { Save, ShoppingCart, Info, List } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, SectionCard, SectionTitle, FormField, PrimaryButton, FlashBanner } from '../../../components/ui'
import VenteItemsEditor from '../../../components/ventes/VenteItemsEditor'
import type { VentesFormProps, VenteItem } from '../../../types/vente'

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
      <BackLink href="/backend/sales" label="Liste des ventes" />

      <div className="mb-6">
        <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
          {isEdit ? `Modifier vente N°${sale.number}` : 'Nouvelle vente'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} noValidate aria-label="Formulaire vente">
        <FlashBanner errors={errors} />
        {natures.length > 1 && (
          <SectionCard className="mb-5">
            <SectionTitle icon={ShoppingCart}>Nature</SectionTitle>
            <FormField label="Nature de vente" required htmlFor="sale-nature" error={errors.nature_id?.[0]}>
              <select id="sale-nature" value={natureId ?? ''}
                onChange={e => setNatureId(parseInt(e.target.value) || null)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                <option value="">Sélectionner…</option>
                {natures.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </FormField>
          </SectionCard>
        )}

        <SectionCard className="mb-5">
          <SectionTitle icon={Info}>Informations</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Client" required htmlFor="sale-client" error={errors.client_id?.[0]}>
                <input id="sale-client" type="text" value={clientName}
                  onChange={e => { setClientName(e.target.value); setClientId(null) }}
                  placeholder="Nom du client"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                {clientId && <input type="hidden" value={clientId} readOnly />}
              </FormField>
            </div>

            <FormField label="Référence externe" htmlFor="sale-ref" error={errors.reference_number?.[0]}>
              <input id="sale-ref" type="text" value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                placeholder="ex. BON-2025-123"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </FormField>

            <FormField label="Date de facturation" htmlFor="sale-date" error={errors.invoiced_at?.[0]}>
              <input id="sale-date" type="date" value={invoicedAt}
                onChange={e => setInvoicedAt(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </FormField>

            <FormField label="Responsable" htmlFor="sale-responsible" error={errors.responsible_id?.[0]}>
              <input id="sale-responsible" type="text" value={responsibleName}
                onChange={e => { setResponsibleName(e.target.value); setResponsibleId(null) }}
                placeholder="Nom du responsable"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              {responsibleId && <input type="hidden" value={responsibleId} readOnly />}
            </FormField>

            {selectedNature?.payment_delay && (
              <FormField label="Délai paiement" htmlFor="sale-delay">
                <input id="sale-delay" type="text" value={selectedNature.payment_delay} readOnly
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none opacity-70"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
            )}

            <div className="col-span-2">
              <FormField label="Description" htmlFor="sale-desc" error={errors.description?.[0]}>
                <textarea id="sale-desc" value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                  placeholder="Informations complémentaires…" />
              </FormField>
            </div>
          </div>
        </SectionCard>

        <SectionCard className="mb-5">
          <SectionTitle icon={List}>Lignes de vente</SectionTitle>
          <VenteItemsEditor
            items={items}
            taxes={taxes}
            currency={selectedNature?.currency ?? sale.currency}
            onChange={setItems}
          />
          {errors.items?.[0] && (
            <p className="mt-2 text-xs" style={{ color: 'var(--color-danger)' }}>{errors.items[0]}</p>
          )}
        </SectionCard>

        <div className="flex items-center gap-3">
          <PrimaryButton type="submit">
            <Save size={15} /> {isEdit ? 'Enregistrer' : 'Créer la vente'}
          </PrimaryButton>
          <PrimaryButton href={isEdit ? `/backend/sales/${sale.id}` : '/backend/sales'} variant="secondary">
            Annuler
          </PrimaryButton>
        </div>
      </form>
    </>
  )
}

VentesForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default VentesForm
