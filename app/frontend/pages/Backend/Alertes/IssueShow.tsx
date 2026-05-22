import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type { IssueShowProps } from '../../../types/issue'
import { ISSUE_NATURE_LABELS, ISSUE_STATE_LABELS } from '../../../types/issue'

function gravityColor(gravity: number): string {
  if (gravity >= 5) return '#dc2626'
  if (gravity === 4) return '#f97316'
  if (gravity === 3) return '#f59e0b'
  return '#6b7280'
}

function stateBg(state: string): string {
  if (state === 'opened') return '#fef9c3'
  if (state === 'closed') return '#dcfce7'
  return '#f3f4f6'
}

function stateColor(state: string): string {
  if (state === 'opened') return '#854d0e'
  if (state === 'closed') return '#166534'
  return '#4b5563'
}

export default function IssueShow({ issue }: IssueShowProps) {
  const card: React.CSSProperties = {
    background: 'var(--color-bg-card)',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)',
    padding: '1rem 1.25rem',
    marginBottom: '1rem',
  }

  function handleClose() {
    router.post(`/backend/issues/${issue.id}/close`)
  }

  function handleAbort() {
    router.post(`/backend/issues/${issue.id}/abort`)
  }

  return (
    <div className="p-8 max-w-2xl">
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

      {/* Titre + état */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          {issue.name}
        </h1>
        <span
          style={{
            background: stateBg(issue.state),
            color: stateColor(issue.state),
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.125rem 0.625rem',
            borderRadius: '9999px',
          }}
        >
          {ISSUE_STATE_LABELS[issue.state] ?? issue.state}
        </span>
      </div>

      {/* Header card */}
      <div style={card}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Nature</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-text)' }}>
              {ISSUE_NATURE_LABELS[issue.nature] ?? issue.nature}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Gravité</p>
            <span
              style={{
                display: 'inline-block',
                marginTop: '0.125rem',
                background: gravityColor(issue.gravity),
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px',
              }}
            >
              {issue.gravity}
            </span>
          </div>
          {issue.observed_at && (
            <div>
              <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Date observée</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-text)' }}>{issue.observed_at}</p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {issue.description && (
        <div style={card}>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--color-text-muted)' }}>Description</p>
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>{issue.description}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4">
        <a
          href={`/backend/issues/${issue.id}/edit`}
          className="px-3 py-2 rounded text-sm font-medium no-underline"
          style={{
            background: 'var(--color-primary)',
            color: '#fff',
          }}
        >
          Modifier
        </a>
        {issue.state === 'opened' && (
          <>
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--color-success-bg)',
                color: 'var(--color-success-text)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleAbort}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--color-bg-card)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
              }}
            >
              Abandonner
            </button>
          </>
        )}
      </div>
    </div>
  )
}

IssueShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
