import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Save, Map } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, IconBox, SectionCard, SectionTitle, FormField, PrimaryButton, FlashBanner } from '../../../components/ui'

interface ParcelleFormData {
  id: number
  name: string
  description: string
  work_number: string
}

interface ParcellesFormProps {
  parcelle: ParcelleFormData | null
  errors: Record<string, string | string[]>
}

const ParcellesForm = ({ parcelle, errors }: ParcellesFormProps) => {
  const isEdit = parcelle !== null

  const [name, setName] = useState(parcelle?.name ?? '')
  const [workNumber, setWorkNumber] = useState(parcelle?.work_number ?? '')
  const [description, setDescription] = useState(parcelle?.description ?? '')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = {
      parcelle: { name, work_number: workNumber, description },
    }
    if (isEdit) {
      router.patch(`/backend/cultivable-zones/${parcelle.id}`, data)
    } else {
      router.post('/backend/cultivable-zones', data)
    }
  }

  return (
    <>
      <BackLink href="/backend/cultivable-zones" label="Liste des parcelles" />

      <div className="flex items-center gap-4 mb-6">
        <IconBox icon={Map} color="var(--color-success-text)" bg="var(--color-success-bg)" />
        <div>
          <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {isEdit ? 'Modifier la parcelle' : 'Nouvelle parcelle'}
          </h1>
          <p className="mt-1 text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
            {isEdit ? 'Modifiez les informations de la parcelle.' : 'Renseignez les informations de la parcelle à créer.'}
          </p>
        </div>
      </div>

      <SectionCard>
        <SectionTitle icon={Map}>Informations de la parcelle</SectionTitle>

        <FlashBanner errors={errors} />

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">
            <FormField label="Nom" required htmlFor="parcelle-name" error={Array.isArray(errors.name) ? errors.name[0] : errors.name}>
              <input id="parcelle-name" type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="ex. Champ Nord" />
            </FormField>

            <FormField label="Numéro de travail" htmlFor="parcelle-work-number" error={Array.isArray(errors.work_number) ? errors.work_number[0] : errors.work_number}>
              <input id="parcelle-work-number" type="text" value={workNumber} onChange={e => setWorkNumber(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="ex. P001" />
            </FormField>

            <FormField label="Description" htmlFor="parcelle-description" error={Array.isArray(errors.description) ? errors.description[0] : errors.description}>
              <textarea id="parcelle-description" value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="Description facultative de la parcelle…" />
            </FormField>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <PrimaryButton type="submit">
              <Save size={15} /> {isEdit ? 'Enregistrer' : 'Créer la parcelle'}
            </PrimaryButton>
            <PrimaryButton href="/backend/cultivable-zones" variant="secondary">Annuler</PrimaryButton>
          </div>
        </form>
      </SectionCard>
    </>
  )
}

ParcellesForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ParcellesForm
