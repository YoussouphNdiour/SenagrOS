import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { usePage } from '@inertiajs/react'
import ComptabiliteIndex from './Index'

const ENTRIES = [
  {
    id: 1, number: 'AC-0001', printed_on: '2024-07-15',
    state: 'confirmed', real_debit: 150000, real_credit: 150000,
    journal_name: 'Achats',
    items: [
      { id: 1, name: 'Semences maïs', account_number: '601', real_debit: 150000, real_credit: 0 },
      { id: 2, name: 'Fournisseur X',  account_number: '401', real_debit: 0,      real_credit: 150000 },
    ],
  },
]

describe('ComptabiliteIndex', () => {
  beforeEach(() => {
    vi.mocked(usePage).mockReturnValue({
      props: { appShell: { farm: { name: 'Ferme' }, campaign: null, user: { name: 'Test', initials: 'T' } }, errors: {} },
      url: '/backend/journal_entries',
      component: 'Backend/Comptabilite/Index',
      version: '1',
      encryptHistory: false,
      clearHistory: false,
      scrollRegions: [],
      rememberedState: {},
    } as ReturnType<typeof usePage>)
  })

  it('affiche le titre', () => {
    render(<ComptabiliteIndex entries={ENTRIES} meta={{ total: 1, page: 1, per_page: 50 }} />)
    expect(screen.getByText('Comptabilité')).toBeInTheDocument()
  })

  it('affiche le numéro d\'écriture', () => {
    render(<ComptabiliteIndex entries={ENTRIES} meta={{ total: 1, page: 1, per_page: 50 }} />)
    expect(screen.getByText('AC-0001')).toBeInTheDocument()
  })

  it('affiche le journal', () => {
    render(<ComptabiliteIndex entries={ENTRIES} meta={{ total: 1, page: 1, per_page: 50 }} />)
    expect(screen.getByText('Achats')).toBeInTheDocument()
  })

  it('expand affiche les items', () => {
    render(<ComptabiliteIndex entries={ENTRIES} meta={{ total: 1, page: 1, per_page: 50 }} />)
    fireEvent.click(screen.getByRole('button', { name: /détails/i }))
    expect(screen.getByText('Semences maïs')).toBeInTheDocument()
    expect(screen.getByText('601')).toBeInTheDocument()
  })

  it('affiche "Aucune écriture" si vide', () => {
    render(<ComptabiliteIndex entries={[]} meta={{ total: 0, page: 1, per_page: 50 }} />)
    expect(screen.getByText(/aucune écriture/i)).toBeInTheDocument()
  })
})
