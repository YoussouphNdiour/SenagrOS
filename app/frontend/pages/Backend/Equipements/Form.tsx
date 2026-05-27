import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Save, Tractor } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, FlashBanner, IconBox, SectionCard, SectionTitle, FormField, PrimaryButton } from '../../../components/ui'
import type { EquipementFormProps } from '../../../types/equipement'

const EquipementsForm = ({ equipement, errors }: EquipementFormProps) => {
  const isEdit = equipement !== null

  const [name, setName] = useState<string>(equipement?.name ?? '')
  const [workNumber, setWorkNumber] = useState<string>(equipement?.work_number ?? '')
  const [description, setDescription] = useState<string>(equipement?.description ?? '')
  const [bornAt, setBornAt] = useState<string>(equipement?.born_at ?? '')
  const [deadAt, setDeadAt] = useState<string>(equipement?.dead_at ?? '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const data = {
      equipement: {
        name,
        work_number: workNumber,
        description,
        born_at: bornAt || null,
        dead_at: deadAt || null,
      },
    }
    if (isEdit) {
      router.patch(`/backend/equipments/${equipement!.id}`, data, { onFinish: () => setSubmitting(false) })
    } else {
      router.post('/backend/equipments', data, { onFinish: () => setSubmitting(false) })
    }
  }

  return (
    <>
      <BackLink href="/backend/equipments" label="Liste des équipements" />

      <div className="flex items-center gap-4 mb-6">
        <IconBox icon={Tractor} color="var(--color-success-text)" bg="var(--color-success-bg)" />
        <div>
          <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {isEdit ? "Modifier l'équipement" : 'Nouvel équipement'}
          </h1>
          <p className="mt-1 text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
            {isEdit ? "Modifiez les informations de l'équipement." : "Renseignez les informations de l'équipement à créer."}
          </p>
        </div>
      </div>

      <SectionCard>
        <SectionTitle icon={Tractor}>Informations de l'équipement</SectionTitle>
        <FlashBanner errors={errors} />

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">
            <FormField label="Nom" required htmlFor="eq-name" error={Array.isArray(errors.name) ? errors.name[0] : errors.name}>
              <input id="eq-name" type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="ex. Tracteur John Deere 5055E" />
            </FormField>

            <FormField label="Numéro de travail" htmlFor="eq-work" error={Array.isArray(errors.work_number) ? errors.work_number[0] : errors.work_number}>
              <input id="eq-work" type="text" value={workNumber} onChange={e => setWorkNumber(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="ex. EQ-001" />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date d'acquisition" htmlFor="eq-born" error={Array.isArray(errors.born_at) ? errors.born_at[0] : errors.born_at}>
                <input id="eq-born" type="date" value={bornAt} onChange={e => setBornAt(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
              <FormField label="Date de retrait" htmlFor="eq-dead" error={Array.isArray(errors.dead_at) ? errors.dead_at[0] : errors.dead_at}>
                <input id="eq-dead" type="date" value={deadAt} onChange={e => setDeadAt(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
            </div>

            <FormField label="Description" htmlFor="eq-desc" error={Array.isArray(errors.description) ? errors.description[0] : errors.description}>
              <textarea id="eq-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="Description facultative de l'équipement…" />
            </FormField>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <PrimaryButton type="submit" disabled={submitting}>
              <Save size={15} /> {isEdit ? 'Enregistrer' : "Créer l'équipement"}
            </PrimaryButton>
            <PrimaryButton href="/backend/equipments" variant="secondary">Annuler</PrimaryButton>
          </div>
        </form>
      </SectionCard>
    </>
  )
}

EquipementsForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default EquipementsForm
