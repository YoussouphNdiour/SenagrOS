import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type { CatalogueShowProps, ProduitType, MouvementType, MovementFormErrors } from '../../../types/catalogue'
import { MOUVEMENT_LABELS } from '../../../types/catalogue'

const TYPE_CONFIG: Record<ProduitType, { label: string; bg: string; color: string }> = {
  Matter:    { label: 'Matière',    bg: '#dcfce7', color: '#166534' },
  Animal:    { label: 'Animal',     bg: '#fef9c3', color: '#854d0e' },
  Equipment: { label: 'Équipement', bg: '#dbeafe', color: '#1e40af' },
  Plant:     { label: 'Plante',     bg: '#ede9fe', color: '#5b21b6' },
  Other:     { label: 'Autre',      bg: '#f3f4f6', color: '#374151' },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function CatalogueShow({ produit, movements, movement_errors }: CatalogueShowProps) {
  const typeCfg = TYPE_CONFIG[produit.produit_type]
  const [delta, setDelta] = useState('')
  const [mouvementType, setMouvementType] = useState<MouvementType>('purchase')
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    router.post(
      `/backend/products/${produit.id}/movements`,
      { delta, mouvement_type: mouvementType, started_at: startedAt },
      { onFinish: () => setSubmitting(false) }
    )
  }

  return (
    <div className="p-8">
      <a
        href="/backend/products"
        className="no-underline text-sm mb-6 inline-block"
        style={{ color: 'var(--color-primary)' }}
      >
        ← Retour au catalogue
      </a>

      <h1 className="text-2xl font-bold mb-4 mt-2" style={{ color: 'var(--color-text)' }}>
        {produit.name}
      </h1>

      {/* Header card */}
      <div
        className="rounded-lg border p-5 mb-6 flex flex-wrap gap-8 items-start"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
            Type
          </p>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ background: typeCfg.bg, color: typeCfg.color }}
          >
            {typeCfg.label}
          </span>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
            Stock
          </p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text)' }}>
            {produit.population}{' '}
            <span className="text-base font-normal" style={{ color: 'var(--color-text-muted)' }}>
              {produit.unit_name}
            </span>
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
            N°
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>{produit.number}</p>
        </div>
      </div>

      {/* Movements */}
      <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
        Mouvements récents
      </h2>

      {movements.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: 'var(--color-text-muted)' }}>
          Aucun mouvement enregistré
        </p>
      ) : (
        <div
          className="rounded-lg overflow-hidden border"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                {['Date', 'Variation', 'Stock résultant', 'Motif'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.map((mv, i) => (
                <tr key={i} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                    {formatDate(mv.started_at)}
                  </td>
                  <td
                    className="px-4 py-3 font-semibold tabular-nums"
                    style={{ color: mv.delta > 0 ? 'var(--color-success-text)' : '#dc2626' }}
                  >
                    {mv.delta > 0 ? `+${mv.delta}` : `${mv.delta}`}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{mv.population}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                    {mv.description ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Movement form */}
      <div className="mt-8">
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
          Saisir un mouvement
        </h2>
        <form
          aria-label="Formulaire mouvement"
          onSubmit={handleSubmit}
          className="rounded-lg border p-5"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            {/* Delta */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Variation (+ entrée / - sortie) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={delta}
                onChange={e => setDelta(e.target.value)}
                placeholder="ex: 10 ou -5"
                className="w-full border rounded px-3 py-2 text-sm"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
              />
              {movement_errors?.delta && (
                <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{movement_errors.delta[0]}</p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Type de mouvement
              </label>
              <select
                value={mouvementType}
                onChange={e => setMouvementType(e.target.value as MouvementType)}
                className="w-full border rounded px-3 py-2 text-sm"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
              >
                {(Object.keys(MOUVEMENT_LABELS) as MouvementType[]).map(k => (
                  <option key={k} value={k}>{MOUVEMENT_LABELS[k]}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Date
              </label>
              <input
                type="date"
                value={startedAt}
                onChange={e => setStartedAt(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.375rem',
                padding: '0.5rem 1.25rem',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Enregistrement…' : 'Enregistrer le mouvement'}
            </button>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Note : la colonne "Stock résultant" sera 0 pour les mouvements saisis manuellement.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

CatalogueShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
