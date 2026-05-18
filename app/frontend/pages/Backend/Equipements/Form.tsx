import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Save, Tractor } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { EquipementFormProps } from '../../../types/equipement'

/**
 * Note: Inline style attributes with CSS variables (e.g., style={{ color: 'var(--color-text)' }})
 * are used consistently across the SenagrOS frontend. This is an intentional project pattern
 * for applying design tokens defined in app/frontend/styles/tokens.css.
 */

const errorStyle = {
  fontSize: '11px',
  color: 'var(--color-danger)',
  marginTop: '4px',
}

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
    if (equipement !== null) {
      router.patch(`/backend/equipments/${equipement.id}`, data, { onFinish: () => setSubmitting(false) })
    } else {
      router.post('/backend/equipments', data, { onFinish: () => setSubmitting(false) })
    }
  }

  return (
    <>
      {/* Back link */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href="/backend/equipments"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Liste des équipements
        </a>
      </div>

      {/* Icon header + Title */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="flex items-center justify-center rounded-lg w-12 h-12 shrink-0"
          style={{ background: '#d1fae5' }}
        >
          <Tractor size={22} style={{ color: '#065f46' }} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            {isEdit ? "Modifier l'équipement" : 'Nouvel équipement'}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {isEdit
              ? "Modifiez les informations de l'équipement."
              : "Renseignez les informations de l'équipement à créer."}
          </p>
        </div>
      </div>

      {/* Form card */}
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
          <Tractor size={14} /> Informations de l'équipement
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">
            {/* Nom */}
            <div>
              <label
                htmlFor="eq-name"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Nom <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="eq-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-invalid={!!errors.name || undefined}
                aria-describedby={errors.name ? 'eq-name-error' : undefined}
                className="w-full rounded px-3 py-2 text-sm"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  outline: 'none',
                }}
                placeholder="ex. Tracteur John Deere 5055E"
              />
              {errors.name && (
                <p id="eq-name-error" style={errorStyle}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Numéro de travail */}
            <div>
              <label
                htmlFor="eq-work"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Numéro de travail
              </label>
              <input
                id="eq-work"
                type="text"
                value={workNumber}
                onChange={(e) => setWorkNumber(e.target.value)}
                aria-invalid={!!errors.work_number || undefined}
                aria-describedby={errors.work_number ? 'eq-work-error' : undefined}
                className="w-full rounded px-3 py-2 text-sm"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  outline: 'none',
                }}
                placeholder="ex. EQ-001"
              />
              {errors.work_number && (
                <p id="eq-work-error" style={errorStyle}>
                  {errors.work_number}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="eq-born"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Date d'acquisition
                </label>
                <input
                  id="eq-born"
                  type="date"
                  value={bornAt}
                  onChange={(e) => setBornAt(e.target.value)}
                  aria-invalid={!!errors.born_at || undefined}
                  aria-describedby={errors.born_at ? 'eq-born-error' : undefined}
                  className="w-full rounded px-3 py-2 text-sm"
                  style={{
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    outline: 'none',
                  }}
                />
                {errors.born_at && (
                  <p id="eq-born-error" style={errorStyle}>
                    {errors.born_at}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="eq-dead"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Date de retrait
                </label>
                <input
                  id="eq-dead"
                  type="date"
                  value={deadAt}
                  onChange={(e) => setDeadAt(e.target.value)}
                  aria-invalid={!!errors.dead_at || undefined}
                  aria-describedby={errors.dead_at ? 'eq-dead-error' : undefined}
                  className="w-full rounded px-3 py-2 text-sm"
                  style={{
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    outline: 'none',
                  }}
                />
                {errors.dead_at && (
                  <p id="eq-dead-error" style={errorStyle}>
                    {errors.dead_at}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="eq-desc"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Description
              </label>
              <textarea
                id="eq-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                aria-invalid={!!errors.description || undefined}
                aria-describedby={errors.description ? 'eq-desc-error' : undefined}
                className="w-full rounded px-3 py-2 text-sm"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  outline: 'none',
                  resize: 'vertical',
                }}
                placeholder="Description facultative de l'équipement…"
              />
              {errors.description && (
                <p id="eq-desc-error" style={errorStyle}>
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
              {isEdit ? 'Enregistrer' : "Créer l'équipement"}
            </button>
            <a
              href="/backend/equipments"
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
    </>
  )
}

EquipementsForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default EquipementsForm
