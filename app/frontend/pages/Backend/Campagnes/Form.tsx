import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Save, Calendar } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'

/**
 * Note: Inline style attributes with CSS variables (e.g., style={{ color: 'var(--color-text)' }})
 * are used consistently across the SenagrOS frontend. This is an intentional project pattern
 * for applying design tokens defined in app/frontend/styles/tokens.css.
 */

interface CampagneData {
  id: number
  name: string
  harvest_year: number
  description: string
  closed: boolean
}

interface CampagnesFormProps {
  campagne: CampagneData | null
  errors: Record<string, string>
}

const CampagnesForm = ({ campagne, errors }: CampagnesFormProps) => {
  const isEdit = campagne !== null

  const [name, setName] = useState(campagne?.name ?? '')
  const [harvestYear, setHarvestYear] = useState<number | ''>(campagne?.harvest_year ?? '')
  const [description, setDescription] = useState(campagne?.description ?? '')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = {
      campagne: {
        name,
        harvest_year: harvestYear === '' ? null : harvestYear,
        description,
      },
    }
    if (isEdit) {
      router.patch(`/backend/campaigns/${campagne.id}`, data)
    } else {
      router.post('/backend/campaigns', data)
    }
  }

  return (
    <>
      {/* Back link */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href="/backend/campaigns"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Liste des campagnes
        </a>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
        >
          {isEdit ? 'Modifier la campagne' : 'Nouvelle campagne'}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {isEdit
            ? 'Modifiez les informations de la campagne.'
            : 'Renseignez les informations de la campagne à créer.'}
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
          <Calendar size={14} /> Informations de la campagne
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">
            {/* Nom */}
            <div>
              <label
                htmlFor="campagne-name"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Nom <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="campagne-name"
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
                placeholder="ex. Hivernage 2025"
              />
              {errors.name && (
                <p className="mt-1 text-xs" style={{ color: '#dc2626' }}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Année de récolte */}
            <div>
              <label
                htmlFor="campagne-harvest-year"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Année de récolte <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="campagne-harvest-year"
                type="number"
                value={harvestYear}
                onChange={(e) =>
                  setHarvestYear(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                }
                required
                min={2000}
                max={2100}
                className="w-full rounded px-3 py-2 text-sm"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  outline: 'none',
                }}
                placeholder="ex. 2025"
              />
              {errors.harvest_year && (
                <p className="mt-1 text-xs" style={{ color: '#dc2626' }}>
                  {errors.harvest_year}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="campagne-description"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Description
              </label>
              <textarea
                id="campagne-description"
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
                placeholder="Description facultative de la campagne…"
              />
              {errors.description && (
                <p className="mt-1 text-xs" style={{ color: '#dc2626' }}>
                  {errors.description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6 pt-5" style={{ borderTop: '1px solid var(--color-border)' }}>
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
              {isEdit ? 'Enregistrer' : 'Créer la campagne'}
            </button>
            <a
              href="/backend/campaigns"
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

CampagnesForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default CampagnesForm
