import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Pencil, Trash2 } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { CatalogueShowProps, InterventionItem, IssueItem, ProduitType, MouvementType, MovementFormErrors, MovementMeta } from '../../../types/catalogue'
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

function computeAge(bornAtIso: string): string {
  const born = new Date(bornAtIso)
  const now = new Date()
  const months = (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth())
  if (months < 1) return "Moins d'1 mois"
  if (months < 12) return `${months} mois`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0
    ? `${years} an${years > 1 ? 's' : ''} ${rem} mois`
    : `${years} an${years > 1 ? 's' : ''}`
}

export default function CatalogueShow({ produit, movements, movement_errors, movement_meta, movement_filter, interventions, issues }: CatalogueShowProps) {
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

      <div className="flex items-center justify-between mb-4 mt-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          {produit.name}
        </h1>
        <div className="flex gap-2">
          <a
            href={`/backend/products/${produit.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium no-underline border"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text)' }}
          >
            <Pencil size={15} />
            Modifier
          </a>
          <a
            href={`/backend/products/${produit.id}`}
            data-method="delete"
            data-confirm="Supprimer ce produit ?"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium no-underline border"
            style={{ borderColor: 'var(--color-danger)', background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)' }}
          >
            <Trash2 size={15} />
            Supprimer
          </a>
        </div>
      </div>

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

        {(produit.produit_type === 'Animal' || produit.produit_type === 'Plant') && produit.born_at && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Âge
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {computeAge(produit.born_at)}
            </p>
          </div>
        )}
      </div>

      {/* Movements */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
          Mouvements récents
        </h2>
        <div className="flex items-center gap-2">
          <label className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Type :
          </label>
          <select
            aria-label="Filtrer les mouvements par type"
            value={movement_filter ?? ''}
            onChange={e => {
              const val = e.target.value
              router.get(`/backend/products/${produit.id}`, val ? { movement_type: val } : {})
            }}
            className="border rounded px-2 py-1 text-sm"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
          >
            <option value="">Tous</option>
            {(Object.keys(MOUVEMENT_LABELS) as MouvementType[]).map(k => (
              <option key={k} value={k}>{MOUVEMENT_LABELS[k]}</option>
            ))}
          </select>
        </div>
      </div>

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

      {movement_meta.total > movement_meta.per_page && (
        <div className="flex justify-center items-center gap-2 mt-3">
          <button
            aria-label="Précédent"
            disabled={movement_meta.page <= 1}
            onClick={() => router.get(`/backend/products/${produit.id}`, {
              movement_page: String(movement_meta.page - 1),
              ...(movement_filter ? { movement_type: movement_filter } : {}),
            })}
            style={{
              padding: '0.375rem 0.875rem', borderRadius: '0.375rem',
              border: '1px solid var(--color-border)', background: 'var(--color-bg-card)',
              cursor: movement_meta.page <= 1 ? 'not-allowed' : 'pointer',
              opacity: movement_meta.page <= 1 ? 0.5 : 1,
              color: 'var(--color-text)',
            }}
          >
            Précédent
          </button>
          <span className="text-sm px-2" style={{ color: 'var(--color-text-muted)' }}>
            Page {movement_meta.page} / {Math.ceil(movement_meta.total / movement_meta.per_page)}
          </span>
          <button
            aria-label="Suivant"
            disabled={movement_meta.page * movement_meta.per_page >= movement_meta.total}
            onClick={() => router.get(`/backend/products/${produit.id}`, {
              movement_page: String(movement_meta.page + 1),
              ...(movement_filter ? { movement_type: movement_filter } : {}),
            })}
            style={{
              padding: '0.375rem 0.875rem', borderRadius: '0.375rem',
              border: '1px solid var(--color-border)', background: 'var(--color-bg-card)',
              cursor: movement_meta.page * movement_meta.per_page >= movement_meta.total ? 'not-allowed' : 'pointer',
              opacity: movement_meta.page * movement_meta.per_page >= movement_meta.total ? 0.5 : 1,
              color: 'var(--color-text)',
            }}
          >
            Suivant
          </button>
        </div>
      )}

      {/* Interventions liées */}
      <div className="mb-6">
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
          Interventions liées ({interventions.length})
        </h2>
        {interventions.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
            Aucune intervention liée à ce produit.
          </p>
        ) : (
          <div style={{ background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                  {['Nom', 'Date', 'Rôle'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {interventions.map((intv: InterventionItem) => (
                  <tr key={intv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-2 font-medium">
                      <a href={`/backend/interventions/${intv.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                        {intv.name || `#${intv.id}`}
                      </a>
                    </td>
                    <td className="px-4 py-2 tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
                      {intv.started_at ? new Date(intv.started_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                      {intv.parameter_type || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Problèmes */}
      <div className="mb-6">
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
          Problèmes ({issues.length})
        </h2>
        {issues.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
            Aucun problème signalé sur ce produit.
          </p>
        ) : (
          <div style={{ background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                  {['Problème', 'Nature', 'Observé le', 'Gravité', 'État'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {issues.map((issue: IssueItem) => (
                  <tr key={issue.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-2 font-medium" style={{ color: 'var(--color-text)' }}>{issue.name}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-text-muted)' }}>{issue.nature}</td>
                    <td className="px-4 py-2 tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
                      {issue.observed_at ? new Date(issue.observed_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-2 tabular-nums" style={{ color: 'var(--color-text)' }}>{issue.gravity}/5</td>
                    <td className="px-4 py-2">
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '9999px',
                        background: issue.state === 'opened' ? '#fef3c7' : issue.state === 'closed' ? '#dcfce7' : '#f3f4f6',
                        color:      issue.state === 'opened' ? '#92400e' : issue.state === 'closed' ? '#166534' : '#374151',
                      }}>
                        {issue.state === 'opened' ? 'Ouvert' : issue.state === 'closed' ? 'Fermé' : 'Abandonné'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                aria-label="Type de mouvement"
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
