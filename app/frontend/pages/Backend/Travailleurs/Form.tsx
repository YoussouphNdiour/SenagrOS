import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Save, HardHat } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, FlashBanner, IconBox, SectionCard, SectionTitle, FormField, PrimaryButton } from '../../../components/ui'
import type { TravailleurFormProps } from '../../../types/travailleur'

const TravailleursForm = ({ travailleur, errors }: TravailleurFormProps) => {
  const isEdit = travailleur !== null && travailleur.id !== undefined

  const [name, setName] = useState<string>(travailleur?.name ?? '')
  const [workNumber, setWorkNumber] = useState<string>(travailleur?.work_number ?? '')
  const [identificationNumber, setIdentificationNumber] = useState<string>(
    travailleur?.identification_number ?? ''
  )
  const [bornAt, setBornAt] = useState<string>(travailleur?.born_at ?? '')
  const [deadAt, setDeadAt] = useState<string>(travailleur?.dead_at ?? '')
  const [description, setDescription] = useState<string>(travailleur?.description ?? '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const data = {
      'worker[name]': name,
      'worker[work_number]': workNumber,
      'worker[identification_number]': identificationNumber,
      'worker[born_at]': bornAt,
      'worker[dead_at]': deadAt,
      'worker[description]': description,
    }
    if (isEdit) {
      router.patch(`/backend/workers/${travailleur!.id}`, data, { onFinish: () => setSubmitting(false) })
    } else {
      router.post('/backend/workers', data, { onFinish: () => setSubmitting(false) })
    }
  }

  return (
    <>
      <BackLink href="/backend/workers" label="Liste des travailleurs" />

      <div className="flex items-center gap-4 mb-6">
        <IconBox icon={HardHat} color="var(--color-primary)" bg="var(--color-success-bg)" />
        <div>
          <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {isEdit ? `Modifier le travailleur ${travailleur!.name}` : 'Nouveau travailleur'}
          </h1>
          <p className="mt-1 text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
            {isEdit ? 'Modifiez les informations du travailleur.' : 'Renseignez les informations du travailleur à créer.'}
          </p>
        </div>
      </div>

      <SectionCard>
        <SectionTitle icon={HardHat}>Informations du travailleur</SectionTitle>
        <FlashBanner errors={errors} />

        <form onSubmit={handleSubmit} noValidate aria-label="Formulaire travailleur">
          <div className="flex flex-col gap-5">
            <FormField label="Nom" required htmlFor="worker-name" error={Array.isArray(errors.name) ? errors.name[0] : errors.name}>
              <input id="worker-name" type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="ex. Mamadou Diallo" />
            </FormField>

            <FormField label="N° travail" htmlFor="worker-work-number" error={Array.isArray(errors.work_number) ? errors.work_number[0] : errors.work_number}>
              <input id="worker-work-number" type="text" value={workNumber} onChange={e => setWorkNumber(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="ex. W-001" />
            </FormField>

            <FormField label="N° identification" htmlFor="worker-identification" error={Array.isArray(errors.identification_number) ? errors.identification_number[0] : errors.identification_number}>
              <input id="worker-identification" type="text" value={identificationNumber} onChange={e => setIdentificationNumber(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="ex. ID-001" />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date de naissance" htmlFor="worker-born-at" error={Array.isArray(errors.born_at) ? errors.born_at[0] : errors.born_at}>
                <input id="worker-born-at" type="date" value={bornAt} onChange={e => setBornAt(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
              <FormField label="Date de départ" htmlFor="worker-dead-at" error={Array.isArray(errors.dead_at) ? errors.dead_at[0] : errors.dead_at}>
                <input id="worker-dead-at" type="date" value={deadAt} onChange={e => setDeadAt(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
            </div>

            <FormField label="Description" htmlFor="worker-description" error={Array.isArray(errors.description) ? errors.description[0] : errors.description}>
              <textarea id="worker-description" value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="Description facultative du travailleur…" />
            </FormField>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <PrimaryButton type="submit" disabled={submitting}>
              <Save size={15} /> {isEdit ? 'Enregistrer' : 'Créer le travailleur'}
            </PrimaryButton>
            <PrimaryButton href="/backend/workers" variant="secondary">Annuler</PrimaryButton>
          </div>
        </form>
      </SectionCard>
    </>
  )
}

TravailleursForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default TravailleursForm
