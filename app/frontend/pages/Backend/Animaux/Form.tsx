import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Save, Beef } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, FlashBanner, IconBox, SectionCard, SectionTitle, FormField, PrimaryButton } from '../../../components/ui'
import type { AnimalFormProps } from '../../../types/animal'

const AnimauxForm = ({ animal, errors }: AnimalFormProps) => {
  const isEdit = animal !== null && animal.id !== undefined

  const [name, setName] = useState<string>(animal?.name ?? '')
  const [workNumber, setWorkNumber] = useState<string>(animal?.work_number ?? '')
  const [variety, setVariety] = useState<string>(animal?.variety ?? '')
  const [identificationNumber, setIdentificationNumber] = useState<string>(
    animal?.identification_number ?? ''
  )
  const [bornAt, setBornAt] = useState<string>(animal?.born_at ?? '')
  const [deadAt, setDeadAt] = useState<string>(animal?.dead_at ?? '')
  const [description, setDescription] = useState<string>(animal?.description ?? '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const data = {
      'animal[name]': name,
      'animal[work_number]': workNumber,
      'animal[variety]': variety,
      'animal[identification_number]': identificationNumber,
      'animal[born_at]': bornAt,
      'animal[dead_at]': deadAt,
      'animal[description]': description,
    }
    if (isEdit) {
      router.patch(`/backend/animals/${animal!.id}`, data, { onFinish: () => setSubmitting(false) })
    } else {
      router.post('/backend/animals', data, { onFinish: () => setSubmitting(false) })
    }
  }

  return (
    <>
      <BackLink href="/backend/animals" label="Liste des animaux" />

      <div className="flex items-center gap-4 mb-6">
        <IconBox icon={Beef} color="var(--color-success-text)" bg="var(--color-success-bg)" />
        <div>
          <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {isEdit ? `Modifier l'animal ${animal!.name}` : 'Nouvel animal'}
          </h1>
          <p className="mt-1 text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
            {isEdit ? "Modifiez les informations de l'animal." : "Renseignez les informations de l'animal à créer."}
          </p>
        </div>
      </div>

      <SectionCard>
        <SectionTitle icon={Beef}>Informations de l'animal</SectionTitle>
        <FlashBanner errors={errors} />

        <form onSubmit={handleSubmit} noValidate aria-label="Formulaire animal">
          <div className="flex flex-col gap-5">
            <FormField label="Nom" required htmlFor="animal-name" error={Array.isArray(errors.name) ? errors.name[0] : errors.name}>
              <input id="animal-name" type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="ex. Bœuf Alpha" />
            </FormField>

            <FormField label="N° travail" htmlFor="animal-work-number" error={Array.isArray(errors.work_number) ? errors.work_number[0] : errors.work_number}>
              <input id="animal-work-number" type="text" value={workNumber} onChange={e => setWorkNumber(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="ex. W-001" />
            </FormField>

            <FormField label="Race / Variété" htmlFor="animal-variety" error={Array.isArray(errors.variety) ? errors.variety[0] : errors.variety}>
              <input id="animal-variety" type="text" value={variety} onChange={e => setVariety(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="ex. Ndama" />
            </FormField>

            <FormField label="N° identification" htmlFor="animal-identification" error={Array.isArray(errors.identification_number) ? errors.identification_number[0] : errors.identification_number}>
              <input id="animal-identification" type="text" value={identificationNumber} onChange={e => setIdentificationNumber(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="ex. ID-001" />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date de naissance" htmlFor="animal-born-at" error={Array.isArray(errors.born_at) ? errors.born_at[0] : errors.born_at}>
                <input id="animal-born-at" type="date" value={bornAt} onChange={e => setBornAt(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
              <FormField label="Date de décès" htmlFor="animal-dead-at" error={Array.isArray(errors.dead_at) ? errors.dead_at[0] : errors.dead_at}>
                <input id="animal-dead-at" type="date" value={deadAt} onChange={e => setDeadAt(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
            </div>

            <FormField label="Description" htmlFor="animal-description" error={Array.isArray(errors.description) ? errors.description[0] : errors.description}>
              <textarea id="animal-description" value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="Description facultative de l'animal…" />
            </FormField>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <PrimaryButton type="submit" disabled={submitting}>
              <Save size={15} /> {isEdit ? 'Enregistrer' : "Créer l'animal"}
            </PrimaryButton>
            <PrimaryButton href="/backend/animals" variant="secondary">Annuler</PrimaryButton>
          </div>
        </form>
      </SectionCard>
    </>
  )
}

AnimauxForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default AnimauxForm
