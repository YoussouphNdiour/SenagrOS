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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: 'var(--color-text)' }}>
          Parcelles
        </h1>
        <a
          href="/backend/cultivable-zones/new"
          style={{ background: 'var(--color-primary)', color: '#fff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}
        >
          + Nouvelle parcelle
        </a>
      </div>

      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '16px' }}>
        {meta.total} parcelle{meta.total !== 1 ? 's' : ''} enregistrée{meta.total !== 1 ? 's' : ''}
      </p>

      <ParcellesMap parcelles={parcelles} highlightId={highlightId} />

      <div style={{ marginTop: '16px', background: 'var(--color-bg-card)', borderRadius: '8px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <ParcellesTable parcelles={parcelles} highlightId={highlightId} onRowClick={setHighlightId} />
      </div>
    </>
  )
}

ParcellesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ParcellesIndex
