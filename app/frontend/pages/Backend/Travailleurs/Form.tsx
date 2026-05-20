import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Save, HardHat } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
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
      {/* Back link */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href="/backend/workers"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Liste des travailleurs
        </a>
      </div>

      {/* Icon header + Title */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="flex items-center justify-center rounded-lg w-12 h-12 shrink-0"
          style={{ background: 'var(--color-primary-bg)' }}
        >
          <HardHat size={22} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            {isEdit ? `Modifier le travailleur ${travailleur!.name}` : 'Nouveau travailleur'}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {isEdit
              ? 'Modifiez les informations du travailleur.'
              : 'Renseignez les informations du travailleur à créer.'}
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
          <HardHat size={14} /> Informations du travailleur
        </h2>

        <form onSubmit={handleSubmit} noValidate aria-label="Formulaire travailleur">
          <div className="flex flex-col gap-5">
            {/* Nom */}
            <div>
              <label
                htmlFor="worker-name"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Nom <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="worker-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-invalid={!!errors.name || undefined}
                aria-describedby={errors.name ? 'worker-name-error' : undefined}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                }}
                placeholder="ex. Mamadou Diallo"
              />
              {errors.name && (
                <p id="worker-name-error" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* N° travail */}
            <div>
              <label
                htmlFor="worker-work-number"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                N° travail
              </label>
              <input
                id="worker-work-number"
                type="text"
                value={workNumber}
                onChange={(e) => setWorkNumber(e.target.value)}
                aria-invalid={!!errors.work_number || undefined}
                aria-describedby={errors.work_number ? 'worker-work-number-error' : undefined}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                }}
                placeholder="ex. W-001"
              />
              {errors.work_number && (
                <p id="worker-work-number-error" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
                  {errors.work_number}
                </p>
              )}
            </div>

            {/* N° identification */}
            <div>
              <label
                htmlFor="worker-identification"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                N° identification
              </label>
              <input
                id="worker-identification"
                type="text"
                value={identificationNumber}
                onChange={(e) => setIdentificationNumber(e.target.value)}
                aria-invalid={!!errors.identification_number || undefined}
                aria-describedby={
                  errors.identification_number ? 'worker-identification-error' : undefined
                }
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                }}
                placeholder="ex. ID-001"
              />
              {errors.identification_number && (
                <p id="worker-identification-error" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
                  {errors.identification_number}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="worker-born-at"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Date de naissance
                </label>
                <input
                  id="worker-born-at"
                  type="date"
                  value={bornAt}
                  onChange={(e) => setBornAt(e.target.value)}
                  aria-invalid={!!errors.born_at || undefined}
                  aria-describedby={errors.born_at ? 'worker-born-at-error' : undefined}
                  className="w-full rounded px-3 py-2 text-sm outline-none"
                  style={{
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                  }}
                />
                {errors.born_at && (
                  <p id="worker-born-at-error" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
                    {errors.born_at}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="worker-dead-at"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Date de départ
                </label>
                <input
                  id="worker-dead-at"
                  type="date"
                  value={deadAt}
                  onChange={(e) => setDeadAt(e.target.value)}
                  aria-invalid={!!errors.dead_at || undefined}
                  aria-describedby={errors.dead_at ? 'worker-dead-at-error' : undefined}
                  className="w-full rounded px-3 py-2 text-sm outline-none"
                  style={{
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                  }}
                />
                {errors.dead_at && (
                  <p id="worker-dead-at-error" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
                    {errors.dead_at}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="worker-description"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Description
              </label>
              <textarea
                id="worker-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                aria-invalid={!!errors.description || undefined}
                aria-describedby={errors.description ? 'worker-description-error' : undefined}
                className="w-full rounded px-3 py-2 text-sm resize-y outline-none"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                }}
                placeholder="Description facultative du travailleur…"
              />
              {errors.description && (
                <p id="worker-description-error" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
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
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium text-white disabled:opacity-50"
              style={{
                background: 'var(--color-primary)',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              <Save size={15} />
              {isEdit ? 'Enregistrer' : 'Créer le travailleur'}
            </button>
            <a
              href="/backend/workers"
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

TravailleursForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default TravailleursForm
