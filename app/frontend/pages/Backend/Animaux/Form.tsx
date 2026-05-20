import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Save, Beef } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
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
      {/* Back link */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href="/backend/animals"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Liste des animaux
        </a>
      </div>

      {/* Icon header + Title */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="flex items-center justify-center rounded-lg w-12 h-12 shrink-0"
          style={{ background: 'var(--color-success-bg)' }}
        >
          <Beef size={22} style={{ color: 'var(--color-success-text)' }} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            {isEdit ? `Modifier l'animal ${animal!.name}` : 'Nouvel animal'}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {isEdit
              ? "Modifiez les informations de l'animal."
              : "Renseignez les informations de l'animal à créer."}
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
          <Beef size={14} /> Informations de l'animal
        </h2>

        <form onSubmit={handleSubmit} noValidate aria-label="Formulaire animal">
          <div className="flex flex-col gap-5">
            {/* Nom */}
            <div>
              <label
                htmlFor="animal-name"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Nom <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="animal-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-invalid={!!errors.name || undefined}
                aria-describedby={errors.name ? 'animal-name-error' : undefined}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                }}
                placeholder="ex. Bœuf Alpha"
              />
              {errors.name && (
                <p id="animal-name-error" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* N° travail */}
            <div>
              <label
                htmlFor="animal-work-number"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                N° travail
              </label>
              <input
                id="animal-work-number"
                type="text"
                value={workNumber}
                onChange={(e) => setWorkNumber(e.target.value)}
                aria-invalid={!!errors.work_number || undefined}
                aria-describedby={errors.work_number ? 'animal-work-number-error' : undefined}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                }}
                placeholder="ex. W-001"
              />
              {errors.work_number && (
                <p id="animal-work-number-error" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
                  {errors.work_number}
                </p>
              )}
            </div>

            {/* Race / Variété */}
            <div>
              <label
                htmlFor="animal-variety"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Race / Variété
              </label>
              <input
                id="animal-variety"
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                aria-invalid={!!errors.variety || undefined}
                aria-describedby={errors.variety ? 'animal-variety-error' : undefined}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                }}
                placeholder="ex. Ndama"
              />
              {errors.variety && (
                <p id="animal-variety-error" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
                  {errors.variety}
                </p>
              )}
            </div>

            {/* N° identification */}
            <div>
              <label
                htmlFor="animal-identification"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                N° identification
              </label>
              <input
                id="animal-identification"
                type="text"
                value={identificationNumber}
                onChange={(e) => setIdentificationNumber(e.target.value)}
                aria-invalid={!!errors.identification_number || undefined}
                aria-describedby={
                  errors.identification_number ? 'animal-identification-error' : undefined
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
                <p id="animal-identification-error" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
                  {errors.identification_number}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="animal-born-at"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Date de naissance
                </label>
                <input
                  id="animal-born-at"
                  type="date"
                  value={bornAt}
                  onChange={(e) => setBornAt(e.target.value)}
                  aria-invalid={!!errors.born_at || undefined}
                  aria-describedby={errors.born_at ? 'animal-born-at-error' : undefined}
                  className="w-full rounded px-3 py-2 text-sm outline-none"
                  style={{
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                  }}
                />
                {errors.born_at && (
                  <p id="animal-born-at-error" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
                    {errors.born_at}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="animal-dead-at"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Date de décès
                </label>
                <input
                  id="animal-dead-at"
                  type="date"
                  value={deadAt}
                  onChange={(e) => setDeadAt(e.target.value)}
                  aria-invalid={!!errors.dead_at || undefined}
                  aria-describedby={errors.dead_at ? 'animal-dead-at-error' : undefined}
                  className="w-full rounded px-3 py-2 text-sm outline-none"
                  style={{
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                  }}
                />
                {errors.dead_at && (
                  <p id="animal-dead-at-error" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
                    {errors.dead_at}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="animal-description"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Description
              </label>
              <textarea
                id="animal-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                aria-invalid={!!errors.description || undefined}
                aria-describedby={errors.description ? 'animal-description-error' : undefined}
                className="w-full rounded px-3 py-2 text-sm outline-none resize-y"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                }}
                placeholder="Description facultative de l'animal…"
              />
              {errors.description && (
                <p id="animal-description-error" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
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
              className="flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{
                background: 'var(--color-primary)',
                border: 'none',
              }}
            >
              <Save size={15} />
              {isEdit ? 'Enregistrer' : "Créer l'animal"}
            </button>
            <a
              href="/backend/animals"
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

AnimauxForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default AnimauxForm
