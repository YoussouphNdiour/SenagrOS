import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Save, Package } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, IconBox, SectionCard, SectionTitle, FormField, PrimaryButton } from '../../../components/ui'
import type { CatalogueFormProps } from '../../../types/catalogue'

export default function CatalogueForm({ produit, errors }: CatalogueFormProps) {
  const [name, setName] = useState(produit.name)
  const [workNumber, setWorkNumber] = useState(produit.work_number ?? '')
  const [description, setDescription] = useState(produit.description ?? '')
  const [bornAt, setBornAt] = useState(produit.born_at ?? '')
  const [deadAt, setDeadAt] = useState(produit.dead_at ?? '')
  const [identificationNumber, setIdentificationNumber] = useState(produit.identification_number ?? '')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)

    const data: Record<string, string> = {
      'product[name]': name,
      'product[work_number]': workNumber,
      'product[description]': description,
      'product[born_at]': bornAt,
      'product[dead_at]': deadAt,
    }

    if (produit.produit_type === 'Animal') {
      data['product[identification_number]'] = identificationNumber
    }

    router.patch(`/backend/products/${produit.id}`, data, {
      onFinish: () => setSubmitting(false),
    })
  }

  return (
    <>
      <BackLink href="/backend/products" label="Retour au catalogue" />

      <div className="flex items-center gap-4 mb-6">
        <IconBox icon={Package} color="var(--color-info)" bg="var(--color-info-bg)" />
        <div>
          <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            Modifier — {produit.name}
          </h1>
        </div>
      </div>

      <SectionCard>
        <SectionTitle icon={Package}>Informations du produit</SectionTitle>

        <form onSubmit={handleSubmit} noValidate aria-label="Formulaire produit">
          <div className="flex flex-col gap-5">
            <FormField label="Nom" required htmlFor="product-name" error={errors.name}>
              <input id="product-name" type="text" required value={name} onChange={e => setName(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </FormField>

            <FormField label="Numéro de travail" htmlFor="product-work-number" error={errors.work_number}>
              <input id="product-work-number" type="text" value={workNumber} onChange={e => setWorkNumber(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date de naissance" htmlFor="product-born-at" error={errors.born_at}>
                <input id="product-born-at" type="date" value={bornAt} onChange={e => setBornAt(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
              <FormField label="Date de décès" htmlFor="product-dead-at" error={errors.dead_at}>
                <input id="product-dead-at" type="date" value={deadAt} onChange={e => setDeadAt(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
            </div>

            {produit.produit_type === 'Animal' && (
              <FormField label="Numéro d'identification" htmlFor="product-identification-number">
                <input id="product-identification-number" type="text" value={identificationNumber}
                  onChange={e => setIdentificationNumber(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
            )}

            <FormField label="Description" htmlFor="product-description" error={errors.description}>
              <textarea id="product-description" rows={4} value={description} onChange={e => setDescription(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </FormField>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <PrimaryButton type="submit" disabled={submitting}>
              <Save size={15} /> Enregistrer
            </PrimaryButton>
            <PrimaryButton href={`/backend/products/${produit.id}`} variant="secondary">Annuler</PrimaryButton>
          </div>
        </form>
      </SectionCard>
    </>
  )
}

CatalogueForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
