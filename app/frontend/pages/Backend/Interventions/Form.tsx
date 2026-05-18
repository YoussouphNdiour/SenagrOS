import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, ClipboardList, Save, ListChecks } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { ProcedureFormBuilder } from '../../../components/interventions/ProcedureFormBuilder'
import type { InterventionFormProps } from '../../../types/intervention'

/**
 * Note: Inline style attributes with CSS variables (e.g., style={{ color: 'var(--color-text)' }})
 * are used consistently across the SenagrOS frontend. This is an intentional project pattern
 * for applying design tokens defined in app/frontend/styles/tokens.css.
 */

const NATURE_OPTIONS = [
  { value: 'request', label: 'Demande' },
  { value: 'record', label: 'Enregistrement' },
]

const STATE_OPTIONS = [
  { value: 'in_progress', label: 'En cours' },
  { value: 'done', label: 'Terminée' },
  { value: 'validated', label: 'Validée' },
]

const errorStyle = {
  fontSize: '11px',
  color: 'var(--color-danger)',
  marginTop: '4px',
}

const inputStyle = {
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  outline: 'none',
}

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
      {/* Back link */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href="/backend/interventions"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Retour aux interventions
        </a>
      </div>

      {/* Icon header + Title */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="flex items-center justify-center rounded-lg w-12 h-12 shrink-0"
          style={{ background: 'var(--color-primary-bg, #e8f5e9)' }}
        >
          <ClipboardList size={22} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            {isEdit ? "Modifier l'intervention" : 'Nouvelle intervention'}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {isEdit
              ? "Modifiez les informations de l'intervention."
              : "Renseignez les informations de l'intervention à créer."}
          </p>
        </div>
      </div>

      {/* Section 1 — Procédure */}
      <div
        className="rounded-lg p-6 mb-4"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <h2
          className="text-sm font-semibold uppercase tracking-wide mb-5 flex items-center gap-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ClipboardList size={14} /> Procédure
        </h2>

        <div>
          <label
            htmlFor="int-procedure"
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-text)' }}
          >
            Procédure
          </label>
          <select
            id="int-procedure"
            value={procedureName}
            onChange={(e) => handleProcedureChange(e.target.value)}
            aria-invalid={!!errors.procedure_name || undefined}
            aria-describedby={errors.procedure_name ? 'int-procedure-error' : undefined}
            className="w-full rounded px-3 py-2 text-sm"
            style={inputStyle}
          >
            <option value="">— Sélectionner une procédure —</option>
            {procedures.map((p) => (
              <option key={p.name} value={p.name}>
                {p.label}
              </option>
            ))}
          </select>
          {errors.procedure_name && (
            <p id="int-procedure-error" style={errorStyle}>
              {errors.procedure_name}
            </p>
          )}
        </div>
      </div>

      {/* Section 2 — Informations */}
      <div
        className="rounded-lg p-6 mb-4"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <h2
          className="text-sm font-semibold uppercase tracking-wide mb-5 flex items-center gap-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ClipboardList size={14} /> Informations
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">
            {/* Nature + State */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="int-nature"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Nature
                </label>
                <select
                  id="int-nature"
                  value={nature}
                  onChange={(e) => setNature(e.target.value)}
                  aria-invalid={!!errors.nature || undefined}
                  aria-describedby={errors.nature ? 'int-nature-error' : undefined}
                  className="w-full rounded px-3 py-2 text-sm"
                  style={inputStyle}
                >
                  {NATURE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.nature && (
                  <p id="int-nature-error" style={errorStyle}>
                    {errors.nature}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="int-state"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  État
                </label>
                <select
                  id="int-state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  aria-invalid={!!errors.state || undefined}
                  aria-describedby={errors.state ? 'int-state-error' : undefined}
                  className="w-full rounded px-3 py-2 text-sm"
                  style={inputStyle}
                >
                  {STATE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p id="int-state-error" style={errorStyle}>
                    {errors.state}
                  </p>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="int-started"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Date de début
                </label>
                <input
                  id="int-started"
                  type="datetime-local"
                  value={startedAt}
                  onChange={(e) => setStartedAt(e.target.value)}
                  aria-invalid={!!errors.started_at || undefined}
                  aria-describedby={errors.started_at ? 'int-started-error' : undefined}
                  className="w-full rounded px-3 py-2 text-sm"
                  style={inputStyle}
                />
                {errors.started_at && (
                  <p id="int-started-error" style={errorStyle}>
                    {errors.started_at}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="int-stopped"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Date de fin
                </label>
                <input
                  id="int-stopped"
                  type="datetime-local"
                  value={stoppedAt}
                  onChange={(e) => setStoppedAt(e.target.value)}
                  aria-invalid={!!errors.stopped_at || undefined}
                  aria-describedby={errors.stopped_at ? 'int-stopped-error' : undefined}
                  className="w-full rounded px-3 py-2 text-sm"
                  style={inputStyle}
                />
                {errors.stopped_at && (
                  <p id="int-stopped-error" style={errorStyle}>
                    {errors.stopped_at}
                  </p>
                )}
              </div>
            </div>

            {/* Numéro */}
            <div>
              <label
                htmlFor="int-number"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Numéro
              </label>
              <input
                id="int-number"
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                aria-invalid={!!errors.number || undefined}
                aria-describedby={errors.number ? 'int-number-error' : undefined}
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
                placeholder="ex. I-001"
              />
              {errors.number && (
                <p id="int-number-error" style={errorStyle}>
                  {errors.number}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="int-desc"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Description
              </label>
              <textarea
                id="int-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                aria-invalid={!!errors.description || undefined}
                aria-describedby={errors.description ? 'int-desc-error' : undefined}
                className="w-full rounded px-3 py-2 text-sm"
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                }}
                placeholder="Description facultative de l'intervention…"
              />
              {errors.description && (
                <p id="int-desc-error" style={errorStyle}>
                  {errors.description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div
            className="flex items-center gap-3 mt-6 pt-5"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
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
              {isEdit ? 'Enregistrer' : "Créer l'intervention"}
            </button>
            <a
              href="/backend/interventions"
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

      {/* Section 3 — Participants */}
      <div
        className="rounded-lg p-6"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <h2
          className="text-sm font-semibold uppercase tracking-wide mb-5 flex items-center gap-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ListChecks size={14} /> Participants
        </h2>

        {procedure_schema !== null ? (
          <ProcedureFormBuilder schema={procedure_schema} />
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Sélectionnez une procédure pour configurer les participants.
          </p>
        )}
      </div>
    </>
  )
}

InterventionsForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default InterventionsForm
