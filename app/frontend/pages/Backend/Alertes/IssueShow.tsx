import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, SectionCard, StateBadge, PrimaryButton } from '../../../components/ui'
import type { IssueShowProps } from '../../../types/issue'
import { ISSUE_NATURE_LABELS, ISSUE_STATE_LABELS } from '../../../types/issue'

function gravityColor(gravity: number): string {
  if (gravity >= 5) return 'var(--color-danger)'
  if (gravity === 4) return '#f97316'
  if (gravity === 3) return 'var(--color-warning-text)'
  return 'var(--color-text-muted)'
}

const STATE_BADGE: Record<string, { bg: string; color: string }> = {
  opened: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' },
  closed: { bg: 'var(--color-success-bg)', color: 'var(--color-success-text)' },
}

export default function IssueShow({ issue }: IssueShowProps) {
  const stateBadge = STATE_BADGE[issue.state] ?? { bg: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)' }

  return (
    <div className="max-w-2xl">
      <BackLink href="/backend/alerts" label="Retour aux alertes" />

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
          {issue.name}
        </h1>
        <StateBadge
          label={ISSUE_STATE_LABELS[issue.state] ?? issue.state}
          color={stateBadge.color}
          bg={stateBadge.bg}
          dot={false}
        />
      </div>

      <SectionCard className="mb-4">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Nature</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-text)' }}>
              {ISSUE_NATURE_LABELS[issue.nature] ?? issue.nature}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Gravité</p>
            <span
              className="inline-block mt-0.5 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: gravityColor(issue.gravity), color: '#fff' }}
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
      </SectionCard>

      {issue.description && (
        <SectionCard className="mb-4">
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--color-text-muted)' }}>Description</p>
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>{issue.description}</p>
        </SectionCard>
      )}

      <div className="flex items-center gap-3 mt-4">
        <PrimaryButton href={`/backend/issues/${issue.id}/edit`} variant="primary">Modifier</PrimaryButton>
        {issue.state === 'opened' && (
          <>
            <button
              type="button"
              onClick={() => router.post(`/backend/issues/${issue.id}/close`)}
              className="px-3 py-2 rounded text-sm font-medium cursor-pointer"
              style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)', border: 'none' }}
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => router.post(`/backend/issues/${issue.id}/abort`)}
              className="px-3 py-2 rounded text-sm font-medium cursor-pointer"
              style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
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
