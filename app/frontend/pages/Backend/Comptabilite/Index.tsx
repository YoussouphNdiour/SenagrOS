import type { ReactNode } from 'react'
import { useState } from 'react'
import { AppShell } from '../../../components/AppShell'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { ComptabiliteIndexProps, JournalEntry } from '../../../types/journal_entry'

const STATE_LABELS: Record<string, string> = {
  draft:     'Brouillon',
  confirmed: 'Confirmé',
  closed:    'Clôturé',
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(amount) + ' FCFA'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function EntryRow({ entry }: { entry: JournalEntry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
        <td className="px-3 py-2.5">
          <button
            aria-label="Détails"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center bg-transparent border-0 cursor-pointer"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </td>
        <td className="px-3 py-2.5 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{entry.number}</td>
        <td className="px-3 py-2.5" style={{ color: 'var(--color-text-muted)' }}>{formatDate(entry.printed_on)}</td>
        <td className="px-3 py-2.5" style={{ color: 'var(--color-text-muted)' }}>{entry.journal_name}</td>
        <td className="px-3 py-2.5 text-right" style={{ color: 'var(--color-text)' }}>{formatAmount(entry.real_debit)}</td>
        <td className="px-3 py-2.5 text-right" style={{ color: 'var(--color-text)' }}>{formatAmount(entry.real_credit)}</td>
        <td className="px-3 py-2.5 text-xs font-semibold" style={{ color: '#1B6B3A' }}>
          {STATE_LABELS[entry.state] ?? entry.state}
        </td>
      </tr>

      {expanded && entry.items.map((item) => (
        <tr key={item.id} className="border-b" style={{ background: '#f9f7f4', borderColor: 'var(--color-border)' }}>
          <td className="px-3 py-1.5" />
          <td className="px-3 py-1.5 pl-6 text-xs" style={{ color: 'var(--color-text-muted)' }} colSpan={2}>
            {item.name}
          </td>
          <td className="px-3 py-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.account_number}</td>
          <td className="px-3 py-1.5 text-right text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {item.real_debit > 0 ? formatAmount(item.real_debit) : ''}
          </td>
          <td className="px-3 py-1.5 text-right text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {item.real_credit > 0 ? formatAmount(item.real_credit) : ''}
          </td>
          <td />
        </tr>
      ))}
    </>
  )
}

function ComptabiliteIndex({ entries, meta }: ComptabiliteIndexProps) {
  return (
    <>
      <h1 className="text-2xl font-bold mb-5" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
        Comptabilité
      </h1>

      {entries.length === 0 ? (
        <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          Aucune écriture comptable.
        </p>
      ) : (
        <div className="rounded-lg overflow-hidden border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                <th className="w-8" />
                {['Numéro', 'Date', 'Journal', 'Débit', 'Crédit', 'État'].map((h) => (
                  <th
                    key={h}
                    className={`px-3 py-2.5 uppercase tracking-wide text-xs font-semibold ${h === 'Débit' || h === 'Crédit' ? 'text-right' : 'text-left'}`}
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <EntryRow key={entry.id} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {meta.total} écriture{meta.total !== 1 ? 's' : ''} — page {meta.page}
      </p>
    </>
  )
}

ComptabiliteIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ComptabiliteIndex
