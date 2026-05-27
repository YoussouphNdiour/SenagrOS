import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ClipboardList, Save, ListChecks } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, IconBox, SectionCard, SectionTitle, FormField, PrimaryButton, FlashBanner } from '../../../components/ui'
import { ProcedureFormBuilder } from '../../../components/interventions/ProcedureFormBuilder'
import type { InterventionFormProps } from '../../../types/intervention'

const NATURE_OPTIONS = [
  { value: 'request', label: 'Demande' },
  { value: 'record', label: 'Enregistrement' },
]

const STATE_OPTIONS = [
  { value: 'in_progress', label: 'En cours' },
  { value: 'done', label: 'Terminée' },
  { value: 'validated', label: 'Validée' },
]

const InterventionsForm = ({
  intervention,
  procedures,
  procedure_schema,
  errors,
}: InterventionFormProps) => {
  const isEdit = intervention !== null

  const [procedureName, setProcedureName] = useState(intervention?.procedure_name ?? '')
  const [nature, setNature] = useState(intervention?.nature ?? 'record')
  const [state, setState] = useState(intervention?.state ?? 'in_progress')
  const [startedAt, setStartedAt] = useState(intervention?.started_at?.slice(0, 16) ?? '')
  const [stoppedAt, setStoppedAt] = useState(intervention?.stopped_at?.slice(0, 16) ?? '')
  const [number, setNumber] = useState(intervention?.number ?? '')
  const [description, setDescription] = useState(intervention?.description ?? '')
  const [submitting, setSubmitting] = useState(false)

  const handleProcedureChange = (value: string) => {
    setProcedureName(value)
    if (isEdit) {
      router.get(`/backend/interventions/${intervention!.id}/edit`, { procedure_name: value })
    } else {
      router.get('/backend/interventions/new', { procedure_name: value })
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const data = {
      intervention: {
        procedure_name: procedureName,
        nature,
        state,
        started_at: startedAt || null,
        stopped_at: stoppedAt || null,
        description,
        number,
      },
    }
    if (isEdit) {
      router.patch(`/backend/interventions/${intervention!.id}`, data, {
        onFinish: () => setSubmitting(false),
      })
    } else {
      router.post('/backend/interventions', data, { onFinish: () => setSubmitting(false) })
    }
  }

  return (
    <>
      <BackLink href="/backend/interventions" label="Retour aux interventions" />

      <div className="flex items-center gap-4 mb-6">
        <IconBox icon={ClipboardList} color="var(--color-primary)" bg="var(--color-success-bg)" />
        <div>
          <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {isEdit ? "Modifier l'intervention" : 'Nouvelle intervention'}
          </h1>
          <p className="mt-1 text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
            {isEdit ? "Modifiez les informations de l'intervention." : "Renseignez les informations de l'intervention à créer."}
          </p>
        </div>
      </div>

      <SectionCard className="mb-4">
        <SectionTitle icon={ClipboardList}>Procédure</SectionTitle>
        <FormField label="Procédure" htmlFor="int-procedure" error={Array.isArray(errors.procedure_name) ? errors.procedure_name[0] : errors.procedure_name}>
          <select id="int-procedure" value={procedureName} onChange={e => handleProcedureChange(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
            <option value="">— Sélectionner une procédure —</option>
            {procedures.map(p => (
              <option key={p.name} value={p.name}>{p.label}</option>
            ))}
          </select>
        </FormField>
      </SectionCard>

      <SectionCard className="mb-4">
        <SectionTitle icon={ClipboardList}>Informations</SectionTitle>

        <FlashBanner errors={errors} />

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Nature" htmlFor="int-nature" error={Array.isArray(errors.nature) ? errors.nature[0] : errors.nature}>
                <select id="int-nature" value={nature} onChange={e => setNature(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                  {NATURE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="État" htmlFor="int-state" error={Array.isArray(errors.state) ? errors.state[0] : errors.state}>
                <select id="int-state" value={state} onChange={e => setState(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                  {STATE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date de début" htmlFor="int-started" error={Array.isArray(errors.started_at) ? errors.started_at[0] : errors.started_at}>
                <input id="int-started" type="datetime-local" value={startedAt} onChange={e => setStartedAt(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
              <FormField label="Date de fin" htmlFor="int-stopped" error={Array.isArray(errors.stopped_at) ? errors.stopped_at[0] : errors.stopped_at}>
                <input id="int-stopped" type="datetime-local" value={stoppedAt} onChange={e => setStoppedAt(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
            </div>

            <FormField label="Numéro" htmlFor="int-number" error={Array.isArray(errors.number) ? errors.number[0] : errors.number}>
              <input id="int-number" type="text" value={number} onChange={e => setNumber(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="ex. I-001" />
            </FormField>

            <FormField label="Description" htmlFor="int-desc" error={Array.isArray(errors.description) ? errors.description[0] : errors.description}>
              <textarea id="int-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="Description facultative de l'intervention…" />
            </FormField>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <PrimaryButton type="submit" disabled={submitting}>
              <Save size={15} /> {isEdit ? 'Enregistrer' : "Créer l'intervention"}
            </PrimaryButton>
            <PrimaryButton href="/backend/interventions" variant="secondary">Annuler</PrimaryButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={ListChecks}>Participants</SectionTitle>
        {procedure_schema !== null ? (
          <ProcedureFormBuilder schema={procedure_schema} />
        ) : (
          <p className="text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
            Sélectionnez une procédure pour configurer les participants.
          </p>
        )}
      </SectionCard>
    </>
  )
}

InterventionsForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default InterventionsForm
