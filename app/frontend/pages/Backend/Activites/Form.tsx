import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Save, Sprout } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { ActiviteFormProps } from '../../../types/activite'

const errorStyle = {
  fontSize: '11px',
  color: 'var(--color-danger)',
  marginTop: '4px',
}

const fieldStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  fontSize: '13px',
} as const

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
      <div className="flex items-center gap-3 mb-6">
        <a
          href="/backend/activities"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Liste des activités
        </a>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div
          className="flex items-center justify-center rounded-lg w-12 h-12 shrink-0"
          style={{ background: 'var(--color-success-bg)' }}
        >
          <Sprout size={22} style={{ color: 'var(--color-success-text)' }} />
        </div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
        >
          {isEdit ? "Modifier l'activité" : 'Nouvelle activité'}
        </h1>
      </div>

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

            <div>
              <label
                htmlFor="act-family"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Famille <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select
                id="act-family"
                value={family}
                onChange={e => setFamily(e.target.value)}
                required
                aria-invalid={!!errors.family || undefined}
                aria-describedby={errors.family ? 'act-family-error' : undefined}
                style={fieldStyle}
              >
                <option value="">— Choisir —</option>
                {families.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              {errors.family && (
                <p id="act-family-error" style={errorStyle}>{errors.family}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="act-name"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Nom <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="act-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                aria-invalid={!!errors.name || undefined}
                aria-describedby={errors.name ? 'act-name-error' : undefined}
                style={fieldStyle}
                placeholder="ex. Culture du mil"
              />
              {errors.name && (
                <p id="act-name-error" style={errorStyle}>{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="act-nature"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Nature
                </label>
                <select
                  id="act-nature"
                  value={nature}
                  onChange={e => setNature(e.target.value)}
                  aria-invalid={!!errors.nature || undefined}
                  aria-describedby={errors.nature ? 'act-nature-error' : undefined}
                  style={fieldStyle}
                >
                  {NATURE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {errors.nature && (
                  <p id="act-nature-error" style={errorStyle}>{errors.nature}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="act-cycle"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Cycle de production
                </label>
                <select
                  id="act-cycle"
                  value={productionCycle}
                  onChange={e => setProductionCycle(e.target.value)}
                  aria-invalid={!!errors.production_cycle || undefined}
                  aria-describedby={errors.production_cycle ? 'act-cycle-error' : undefined}
                  style={fieldStyle}
                >
                  {CYCLE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {errors.production_cycle && (
                  <p id="act-cycle-error" style={errorStyle}>{errors.production_cycle}</p>
                )}
              </div>
            </div>

            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <input
                  id="act-supports"
                  type="checkbox"
                  checked={withSupports}
                  onChange={e => setWithSupports(e.target.checked)}
                />
                <label
                  htmlFor="act-supports"
                  className="text-sm"
                  style={{ color: 'var(--color-text)', cursor: 'pointer' }}
                >
                  Avec supports
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="act-suspended"
                  type="checkbox"
                  checked={suspended}
                  onChange={e => setSuspended(e.target.checked)}
                />
                <label
                  htmlFor="act-suspended"
                  className="text-sm"
                  style={{ color: 'var(--color-text)', cursor: 'pointer' }}
                >
                  Suspendue
                </label>
              </div>
            </div>

            <div>
              <label
                htmlFor="act-desc"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Description
              </label>
              <textarea
                id="act-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                aria-invalid={!!errors.description || undefined}
                aria-describedby={errors.description ? 'act-desc-error' : undefined}
                style={{ ...fieldStyle, resize: 'vertical' }}
                placeholder="Description facultative…"
              />
              {errors.description && (
                <p id="act-desc-error" style={errorStyle}>{errors.description}</p>
              )}
            </div>

          </div>

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
              {isEdit ? 'Enregistrer' : "Créer l'activité"}
            </button>
            <a
              href="/backend/activities"
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

ActivitesForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ActivitesForm
