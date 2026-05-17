import type { ReactNode } from 'react'
import { useState } from 'react'
import { AppShell }       from '../../../components/AppShell'
import { ParcellesMap }   from '../../../components/parcelles/ParcellesMap'
import { ParcellesTable } from '../../../components/parcelles/ParcellesTable'
import type { ParcellesIndexProps } from '../../../types/parcelle'

function ParcellesIndex({ parcelles, meta }: ParcellesIndexProps) {
  const [highlightId, setHighlightId] = useState<number | null>(null)

  return (
    <>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-[22px] font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
          Parcelles
        </h1>
        <a
          href="/backend/cultivable-zones/new"
          className="px-4 py-2 rounded-md text-sm font-semibold text-white no-underline"
          style={{ background: 'var(--color-primary)' }}
        >
          + Nouvelle parcelle
        </a>
      </div>

      <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
        {meta.total} parcelle{meta.total !== 1 ? 's' : ''} enregistrée{meta.total !== 1 ? 's' : ''}
      </p>

      <ParcellesMap parcelles={parcelles} highlightId={highlightId} />

      <div className="mt-4 rounded-lg overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <ParcellesTable parcelles={parcelles} highlightId={highlightId} onRowClick={setHighlightId} />
      </div>
    </>
  )
}

ParcellesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ParcellesIndex
