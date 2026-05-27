import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Save, Calendar } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, IconBox, SectionCard, SectionTitle, FormField, PrimaryButton, FlashBanner } from '../../../components/ui'

interface CampagneData {
  id: number
  name: string
  harvest_year: number
  description: string
  closed: boolean
}

interface CampagnesFormProps {
  campagne: CampagneData | null
  errors: Record<string, string | string[]>
}

const CampagnesForm = ({ campagne, errors }: CampagnesFormProps) => {
  const isEdit = campagne !== null

  const [name, setName] = useState(campagne?.name ?? '')
  const [harvestYear, setHarvestYear] = useState<number | ''>(campagne?.harvest_year ?? '')
  const [description, setDescription] = useState(campagne?.description ?? '')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = {
      campagne: {
        name,
        harvest_year: harvestYear === '' ? null : harvestYear,
        description,
      },
    }
    if (isEdit) {
      router.patch(`/backend/campaigns/${campagne.id}`, data)
    } else {
      router.post('/backend/campaigns', data)
    }
  }

  return (
    <>
      <BackLink href="/backend/campaigns" label="Liste des campagnes" />

      <div className="flex items-center gap-4 mb-6">
        <IconBox icon={Calendar} color="var(--color-info)" bg="var(--color-info-bg)" />
        <div>
          <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {isEdit ? 'Modifier la campagne' : 'Nouvelle campagne'}
          </h1>
          <p className="mt-1 text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
            {isEdit ? 'Modifiez les informations de la campagne.' : 'Renseignez les informations de la campagne à créer.'}
          </p>
        </div>
      </div>

      <SectionCard>
        <SectionTitle icon={Calendar}>Informations de la campagne</SectionTitle>

        <FlashBanner errors={errors} />

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">
            <FormField label="Nom" required htmlFor="campagne-name" error={Array.isArray(errors.name) ? errors.name[0] : errors.name}>
              <input id="campagne-name" type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="ex. Hivernage 2025" />
            </FormField>

            <FormField label="Année de récolte" required htmlFor="campagne-harvest-year" error={Array.isArray(errors.harvest_year) ? errors.harvest_year[0] : errors.harvest_year}>
              <input id="campagne-harvest-year" type="number" value={harvestYear}
                onChange={e => setHarvestYear(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                required min={2000} max={2100}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="ex. 2025" />
            </FormField>

            <FormField label="Description" htmlFor="campagne-description" error={Array.isArray(errors.description) ? errors.description[0] : errors.description}>
              <textarea id="campagne-description" value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="Description facultative de la campagne…" />
            </FormField>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <PrimaryButton type="submit">
              <Save size={15} /> {isEdit ? 'Enregistrer' : 'Créer la campagne'}
            </PrimaryButton>
            <PrimaryButton href="/backend/campaigns" variant="secondary">Annuler</PrimaryButton>
          </div>
        </form>
      </SectionCard>
    </>
  )
}

CampagnesForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default CampagnesForm
