import type { ReactNode } from 'react'
import { ArrowLeft, BookOpen, FileText, TrendingUp, TrendingDown } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { JournalEntryShowProps } from '../../../types/journal_entry'

const STATE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  draft:     { bg: '#fef3c7', color: '#92400e', label: 'Brouillon' },
  confirmed: { bg: '#dbeafe', color: '#1e40af', label: 'Confirmée' },
  closed:    { bg: '#d1fae5', color: '#065f46', label: 'Clôturée' },
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'XOF',
      minimumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount.toFixed(0)} ${currency}`
  }
}

function JournalEntryShow({ entry, items }: JournalEntryShowProps) {
  const stateConfig =
    STATE_COLORS[entry.state] ?? { bg: '#f3f4f6', color: '#374151', label: entry.state }
  const currency = entry.real_currency || 'XOF'
  const balance = entry.real_debit - entry.real_credit
  const isBalanced = Math.abs(balance) < 0.01

  const balanceBg = isBalanced ? '#d1fae5' : '#fef3c7'
  const balanceColor = isBalanced ? '#065f46' : '#92400e'

  const detailItems: Array<{ label: string; value: string }> = [
    { label: 'Date comptable', value: entry.printed_on ?? '—' },
    { label: 'Journal', value: entry.journal_name || '—' },
    { label: 'Exercice', value: entry.financial_year_name || '—' },
    { label: 'N° continu', value: entry.continuous_number || '—' },
    { label: 'N° référence', value: entry.reference_number || '—' },
    {
      label: 'Devise',
      value: `${currency}${entry.real_currency_rate !== 1 ? ` (taux: ${entry.real_currency_rate})` : ''}`,
    },
  ]

  return (
    <>
      {/* Back */}
      <div className="mb-6">
        <a
          href="/backend/journal_entries"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Retour aux écritures
        </a>
      </div>

      {/* Title */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono font-semibold" style={{ color: 'var(--color-text)' }}>
              {entry.number}
            </span>
            <span
              className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: stateConfig.bg, color: stateConfig.color }}
            >
              {stateConfig.label}
            </span>
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            {entry.name || entry.number}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {entry.journal_name}
            {entry.financial_year_name ? ` · ${entry.financial_year_name}` : ''}
          </p>
        </div>
        {entry.state === 'draft' && (
          <a
            href={`/backend/journal_entries/${entry.id}/edit`}
            className="px-3 py-1.5 rounded text-sm font-medium no-underline"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            Modifier
          </a>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div
          className="rounded-lg p-4"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} style={{ color: '#1e40af' }} />
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Débit total
            </span>
          </div>
          <div className="text-lg font-bold" style={{ color: '#1e40af' }}>
            {formatAmount(entry.real_debit, currency)}
          </div>
        </div>

        <div
          className="rounded-lg p-4"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} style={{ color: '#065f46' }} />
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Crédit total
            </span>
          </div>
          <div className="text-lg font-bold" style={{ color: '#065f46' }}>
            {formatAmount(entry.real_credit, currency)}
          </div>
        </div>

        <div
          className="rounded-lg p-4"
          style={{
            background: balanceBg,
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} style={{ color: balanceColor }} />
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Balance
            </span>
          </div>
          <div className="text-lg font-bold" style={{ color: balanceColor }}>
            {isBalanced ? 'Équilibrée' : formatAmount(balance, currency)}
          </div>
        </div>
      </div>

      {/* Info card */}
      <div
        className="rounded-lg p-5 mb-5"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <h2
          className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <FileText size={14} /> Détails
        </h2>
        <dl className="grid gap-x-8 gap-y-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {detailItems.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {label}
              </dt>
              <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Items table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          className="px-5 py-4 flex items-center gap-2"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <BookOpen size={16} style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Lignes d&apos;écriture ({items.length})
          </h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-bg-subtle)' }}>
                {['#', 'Libellé', 'Compte', 'Nom du compte', 'Lettrage', 'Débit', 'Crédit'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr
                  key={item.id}
                  style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}
                >
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {item.position}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {item.name}
                  </td>
                  <td
                    className="px-4 py-3 font-mono text-xs font-medium"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {item.account_number}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                    {item.account_name}
                  </td>
                  <td className="px-4 py-3">
                    {item.letter ? (
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-xs font-mono font-semibold"
                        style={{ background: '#dbeafe', color: '#1e40af' }}
                      >
                        {item.letter}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td
                    className="px-4 py-3 text-right font-medium"
                    style={{ color: item.real_debit > 0 ? '#1e40af' : 'var(--color-text-muted)' }}
                  >
                    {item.real_debit > 0 ? formatAmount(item.real_debit, currency) : '—'}
                  </td>
                  <td
                    className="px-4 py-3 text-right font-medium"
                    style={{ color: item.real_credit > 0 ? '#065f46' : 'var(--color-text-muted)' }}
                  >
                    {item.real_credit > 0 ? formatAmount(item.real_credit, currency) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr
                  style={{
                    borderTop: '2px solid var(--color-border)',
                    background: 'var(--color-bg-subtle)',
                  }}
                >
                  <td
                    colSpan={5}
                    className="px-4 py-2 text-xs font-semibold text-right"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Totaux
                  </td>
                  <td className="px-4 py-2 text-right font-bold" style={{ color: '#1e40af' }}>
                    {formatAmount(entry.real_debit, currency)}
                  </td>
                  <td className="px-4 py-2 text-right font-bold" style={{ color: '#065f46' }}>
                    {formatAmount(entry.real_credit, currency)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </>
  )
}

JournalEntryShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default JournalEntryShow
