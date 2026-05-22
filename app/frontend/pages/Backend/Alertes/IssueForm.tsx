import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Save } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { IssueFormProps } from '../../../types/issue'
import { ISSUE_NATURE_LABELS } from '../../../types/issue'

const today = new Date().toISOString().split('T')[0]

const errorStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-danger)',
  marginTop: '4px',
}

const GRAVITY_COLOR: Record<number, string> = {
  1: '#6b7280',
  2: '#6b7280',
  3: '#f59e0b',
  4: '#f97316',
  5: '#dc2626',
}

export default function IssueForm({ issue, errors }: IssueFormProps) {
  const isEdit = issue !== null

  const [name, setName] = useState(issue?.name ?? '')
  const [nature, setNature] = useState(issue?.nature ?? '')
  const [gravity, setGravity] = useState<number>(issue?.gravity ?? 1)
  const [observedAt, setObservedAt] = useState(issue?.observed_at ?? today)
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

  const inputStyle: React.CSSProperties = {
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    outline: 'none',
  }

  return (
    <div className="p-8 max-w-xl">
      {/* Retour */}
      <div className="mb-4">
        <a
          href="/backend/alerts"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={15} />
          Retour aux alertes
        </a>
      </div>

      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
        {isEdit ? `Modifier — ${issue!.name}` : 'Nouveau problème'}
      </h1>

      <div
        className="rounded-lg p-6"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">
            {/* Nom */}
            <div>
              <label htmlFor="issue-name" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Nom <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="issue-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
                placeholder="ex. Attaque criquet"
              />
              {errors.name && <p style={errorStyle}>{errors.name}</p>}
            </div>

            {/* Nature */}
            <div>
              <label htmlFor="issue-nature" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Nature <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select
                id="issue-nature"
                value={nature}
                onChange={(e) => setNature(e.target.value)}
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
              >
                <option value="">— Choisir une nature —</option>
                {Object.entries(ISSUE_NATURE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              {errors.nature && <p style={errorStyle}>{errors.nature}</p>}
            </div>

            {/* Gravite */}
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Gravite <span style={{ color: 'var(--color-danger)' }}>*</span>
              </p>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as const).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGravity(g)}
                    className="w-10 h-10 rounded-full text-sm font-bold"
                    style={{
                      background: gravity === g ? GRAVITY_COLOR[g] : 'var(--color-bg-card)',
                      color: gravity === g ? '#fff' : GRAVITY_COLOR[g],
                      border: `2px solid ${GRAVITY_COLOR[g]}`,
                      cursor: 'pointer',
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
              {errors.gravity && <p style={errorStyle}>{errors.gravity}</p>}
            </div>

            {/* Date observee */}
            <div>
              <label htmlFor="issue-date" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Date observee <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="issue-date"
                type="date"
                value={observedAt}
                onChange={(e) => setObservedAt(e.target.value)}
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
              />
              {errors.observed_at && <p style={errorStyle}>{errors.observed_at}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="issue-desc" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Description
              </label>
              <textarea
                id="issue-desc"
                value={description ?? ''}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded px-3 py-2 text-sm"
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="Description optionnelle..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6 pt-5" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              <Save size={15} />
              Enregistrer
            </button>
            <a
              href="/backend/alerts"
              className="px-4 py-2 rounded text-sm font-medium no-underline"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              Annuler
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

IssueForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
