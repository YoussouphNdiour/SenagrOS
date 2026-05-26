import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Save, AlertTriangle } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, IconBox, SectionCard, SectionTitle, FormField, PrimaryButton } from '../../../components/ui'
import type { IssueFormProps } from '../../../types/issue'
import { ISSUE_NATURE_LABELS } from '../../../types/issue'

const GRAVITY_COLOR: Record<number, string> = {
  1: 'var(--color-text-muted)',
  2: 'var(--color-text-muted)',
  3: 'var(--color-warning)',
  4: '#f97316',
  5: 'var(--color-danger)',
}

export default function IssueForm({ issue, errors }: IssueFormProps) {
  const isEdit = issue !== null

  const [name, setName] = useState(issue?.name ?? '')
  const [nature, setNature] = useState(issue?.nature ?? '')
  const [gravity, setGravity] = useState<number>(issue?.gravity ?? 1)
  const [observedAt, setObservedAt] = useState(
    issue?.observed_at ?? new Date().toISOString().split('T')[0]
  )
  const [description, setDescription] = useState(issue?.description ?? '')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    const data = {
      issue: {
        name,
        nature,
        gravity,
        observed_at: observedAt,
        description: description || null,
      },
    }
    if (isEdit) {
      router.patch(`/backend/issues/${issue!.id}`, data, { onFinish: () => setSubmitting(false) })
    } else {
      router.post('/backend/issues', data, { onFinish: () => setSubmitting(false) })
    }
  }

  return (
    <>
      <BackLink href="/backend/alerts" label="Retour aux alertes" />

      <div className="flex items-center gap-4 mb-6">
        <IconBox icon={AlertTriangle} color="var(--color-warning-text)" bg="var(--color-warning-bg)" />
        <div>
          <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {isEdit ? `Modifier — ${issue!.name}` : 'Nouveau problème'}
          </h1>
        </div>
      </div>

      <SectionCard>
        <SectionTitle icon={AlertTriangle}>Informations du problème</SectionTitle>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">
            <FormField label="Nom" required htmlFor="issue-name" error={errors.name}>
              <input id="issue-name" type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="ex. Attaque criquet" />
            </FormField>

            <FormField label="Nature" required htmlFor="issue-nature" error={errors.nature}>
              <select id="issue-nature" value={nature} onChange={e => setNature(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                <option value="">— Choisir une nature —</option>
                {Object.entries(ISSUE_NATURE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </FormField>

            <div>
              <p className="text-sm font-medium mb-2 m-0" style={{ color: 'var(--color-text)' }}>
                Gravité <span style={{ color: 'var(--color-danger)' }}>*</span>
              </p>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as const).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGravity(g)}
                    className="w-10 h-10 rounded-full text-sm font-bold cursor-pointer"
                    style={{
                      background: gravity === g ? GRAVITY_COLOR[g] : 'var(--color-bg-card)',
                      color: gravity === g ? '#fff' : GRAVITY_COLOR[g],
                      border: `2px solid ${GRAVITY_COLOR[g]}`,
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
              {errors.gravity && <p className="text-xs mt-1 m-0" style={{ color: 'var(--color-danger)' }}>{errors.gravity}</p>}
            </div>

            <FormField label="Date observée" required htmlFor="issue-date" error={errors.observed_at}>
              <input id="issue-date" type="date" value={observedAt} onChange={e => setObservedAt(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </FormField>

            <FormField label="Description" htmlFor="issue-desc">
              <textarea id="issue-desc" value={description ?? ''} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="Description optionnelle..." />
            </FormField>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <PrimaryButton type="submit" disabled={submitting}>
              <Save size={15} /> Enregistrer
            </PrimaryButton>
            <PrimaryButton href="/backend/alerts" variant="secondary">Annuler</PrimaryButton>
          </div>
        </form>
      </SectionCard>
    </>
  )
}

IssueForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
