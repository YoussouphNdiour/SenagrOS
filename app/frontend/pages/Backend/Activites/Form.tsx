import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Save, Sprout } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, IconBox, SectionCard, SectionTitle, FormField, PrimaryButton } from '../../../components/ui'
import type { ActiviteFormProps } from '../../../types/activite'

const NATURE_OPTIONS = [
  { value: 'main',       label: 'Principale' },
  { value: 'auxiliary',  label: 'Auxiliaire' },
  { value: 'standalone', label: 'Autonome' },
]

const CYCLE_OPTIONS = [
  { value: 'annual',    label: 'Annuel' },
  { value: 'perennial', label: 'Pérenne' },
]

const ActivitesForm = ({ activite, families, errors }: ActiviteFormProps) => {
  const isEdit = activite !== null

  const [family,          setFamily]          = useState<string>(activite?.family           ?? '')
  const [name,            setName]            = useState<string>(activite?.name             ?? '')
  const [nature,          setNature]          = useState<string>(activite?.nature           ?? 'main')
  const [productionCycle, setProductionCycle] = useState<string>(activite?.production_cycle ?? 'annual')
  const [withSupports,    setWithSupports]    = useState<boolean>(activite?.with_supports   ?? false)
  const [suspended,       setSuspended]       = useState<boolean>(activite?.suspended       ?? false)
  const [description,     setDescription]     = useState<string>(activite?.description      ?? '')
  const [submitting,      setSubmitting]      = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const data = {
      activite: {
        family,
        name,
        nature,
        production_cycle: productionCycle,
        with_supports: withSupports,
        suspended,
        description,
      },
    }
    if (isEdit) {
      router.patch(`/backend/activities/${activite.id}`, data, { onFinish: () => setSubmitting(false) })
    } else {
      router.post('/backend/activities', data, { onFinish: () => setSubmitting(false) })
    }
  }

  return (
    <>
      <BackLink href="/backend/activities" label="Liste des activités" />

      <div className="flex items-center gap-4 mb-6">
        <IconBox icon={Sprout} color="var(--color-success-text)" bg="var(--color-success-bg)" />
        <div>
          <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {isEdit ? "Modifier l'activité" : 'Nouvelle activité'}
          </h1>
          <p className="mt-1 text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
            {isEdit ? "Modifiez les informations de l'activité." : "Renseignez les informations de l'activité à créer."}
          </p>
        </div>
      </div>

      <SectionCard>
        <SectionTitle icon={Sprout}>Informations de l'activité</SectionTitle>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">
            <FormField label="Famille" required htmlFor="act-family" error={errors.family}>
              <select id="act-family" value={family} onChange={e => setFamily(e.target.value)} required
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                <option value="">— Choisir —</option>
                {families.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Nom" required htmlFor="act-name" error={errors.name}>
              <input id="act-name" type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="ex. Culture du mil" />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Nature" htmlFor="act-nature" error={errors.nature}>
                <select id="act-nature" value={nature} onChange={e => setNature(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                  {NATURE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Cycle de production" htmlFor="act-cycle" error={errors.production_cycle}>
                <select id="act-cycle" value={productionCycle} onChange={e => setProductionCycle(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                  {CYCLE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <input id="act-supports" type="checkbox" checked={withSupports} onChange={e => setWithSupports(e.target.checked)} />
                <label htmlFor="act-supports" className="text-sm cursor-pointer" style={{ color: 'var(--color-text)' }}>
                  Avec supports
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input id="act-suspended" type="checkbox" checked={suspended} onChange={e => setSuspended(e.target.checked)} />
                <label htmlFor="act-suspended" className="text-sm cursor-pointer" style={{ color: 'var(--color-text)' }}>
                  Suspendue
                </label>
              </div>
            </div>

            <FormField label="Description" htmlFor="act-desc" error={errors.description}>
              <textarea id="act-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="Description facultative…" />
            </FormField>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <PrimaryButton type="submit" disabled={submitting}>
              <Save size={15} /> {isEdit ? 'Enregistrer' : "Créer l'activité"}
            </PrimaryButton>
            <PrimaryButton href="/backend/activities" variant="secondary">Annuler</PrimaryButton>
          </div>
        </form>
      </SectionCard>
    </>
  )
}

ActivitesForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ActivitesForm
