import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Save, Map } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'

interface ParcelleFormData {
  id: number
  name: string
  description: string
  work_number: string
}

interface ParcellesFormProps {
  parcelle: ParcelleFormData | null
  errors: Record<string, string>
}

const ParcellesForm = ({ parcelle, errors }: ParcellesFormProps) => {
  const isEdit = parcelle !== null

  const [name, setName] = useState(parcelle?.name ?? '')
  const [workNumber, setWorkNumber] = useState(parcelle?.work_number ?? '')
  const [description, setDescription] = useState(parcelle?.description ?? '')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = {
      parcelle: { name, work_number: workNumber, description },
    }
    if (isEdit) {
      router.patch(`/backend/cultivable-zones/${parcelle.id}`, data)
    } else {
      router.post('/backend/cultivable-zones', data)
    }
  }

  return (
    <>
      {/* Back link */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href="/backend/cultivable-zones"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Liste des parcelles
        </a>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
        >
          {isEdit ? 'Modifier la parcelle' : 'Nouvelle parcelle'}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {isEdit
            ? 'Modifiez les informations de la parcelle.'
            : 'Renseignez les informations de la parcelle à créer.'}
        </p>
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
          <Map size={14} /> Informations de la parcelle
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">
            {/* Nom */}
            <div>
              <label
                htmlFor="parcelle-name"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Nom <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="parcelle-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded px-3 py-2 text-sm"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  outline: 'none',
                }}
                placeholder="ex. Champ Nord"
              />
              {errors.name && (
                <p className="mt-1 text-xs" style={{ color: '#dc2626' }}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Numéro de travail */}
            <div>
              <label
                htmlFor="parcelle-work-number"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Numéro de travail
              </label>
              <input
                id="parcelle-work-number"
                type="text"
                value={workNumber}
                onChange={(e) => setWorkNumber(e.target.value)}
                className="w-full rounded px-3 py-2 text-sm"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  outline: 'none',
                }}
                placeholder="ex. P001"
              />
              {errors.work_number && (
                <p className="mt-1 text-xs" style={{ color: '#dc2626' }}>
                  {errors.work_number}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="parcelle-description"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Description
              </label>
              <textarea
                id="parcelle-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded px-3 py-2 text-sm"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  outline: 'none',
                  resize: 'vertical',
                }}
                placeholder="Description facultative de la parcelle…"
              />
              {errors.description && (
                <p className="mt-1 text-xs" style={{ color: '#dc2626' }}>
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
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Save size={15} />
              {isEdit ? 'Enregistrer' : 'Créer la parcelle'}
            </button>
            <a
              href="/backend/cultivable-zones"
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

ParcellesForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ParcellesForm
