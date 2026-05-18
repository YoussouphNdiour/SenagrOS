import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ComptabiliteForm from './Form'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), patch: vi.fn() },
  usePage: vi.fn(() => ({ props: { flash: {} } })),
}))

// AppShell mock — layout is applied externally by Inertia, tests render bare component
vi.mock('../../../components/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import { router } from '@inertiajs/react'

const journals = [
  { id: 1, name: 'Achats' },
  { id: 2, name: 'Ventes' },
]

const entry = {
  id: 42,
  journal_id: 1,
  printed_on: '2024-03-15',
  reference_number: 'REF-001',
  items: [
    { id: 10, name: 'Achat marchandises', account_number: '607', real_debit: 1000, real_credit: 0 },
    { id: 11, name: 'TVA', account_number: '4456', real_debit: 200, real_credit: 0 },
    { id: 12, name: 'Fournisseur', account_number: '401', real_debit: 0, real_credit: 1200 },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ComptabiliteForm', () => {
  // Test 1
  it('renders "Nouvelle écriture" heading when entry is null', () => {
    render(<ComptabiliteForm entry={null} journals={journals} errors={{}} />)
    expect(screen.getByRole('heading', { name: /Nouvelle écriture/i })).toBeInTheDocument()
  })

  // Test 2
  it('renders "Modifier l\'écriture" heading when entry has data', () => {
    render(<ComptabiliteForm entry={entry} journals={journals} errors={{}} />)
    expect(screen.getByRole('heading', { name: /Modifier l'écriture/i })).toBeInTheDocument()
  })

  // Test 3
  it('journal select renders all journals from prop', () => {
    render(<ComptabiliteForm entry={null} journals={journals} errors={{}} />)
    expect(screen.getByRole('option', { name: 'Achats' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Ventes' })).toBeInTheDocument()
  })

  // Test 4
  it('journal select defaults to empty option when entry is null', () => {
    render(<ComptabiliteForm entry={null} journals={journals} errors={{}} />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('')
  })

  // Test 5
  it('journal select defaults to entry.journal_id when editing', () => {
    render(<ComptabiliteForm entry={entry} journals={journals} errors={{}} />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('1')
  })

  // Test 6
  it('printed_on input renders with entry.printed_on value when editing', () => {
    render(<ComptabiliteForm entry={entry} journals={journals} errors={{}} />)
    const dateInput = screen.getByLabelText(/Date comptable/i) as HTMLInputElement
    expect(dateInput.value).toBe('2024-03-15')
  })

  // Test 7
  it('reference number input renders with entry.reference_number when editing', () => {
    render(<ComptabiliteForm entry={entry} journals={journals} errors={{}} />)
    const refInput = screen.getByLabelText(/N° de référence/i) as HTMLInputElement
    expect(refInput.value).toBe('REF-001')
  })

  // Test 8
  it('shows two default rows when creating new entry', () => {
    render(<ComptabiliteForm entry={null} journals={journals} errors={{}} />)
    const libelleInputs = screen.getAllByPlaceholderText('Libellé')
    expect(libelleInputs).toHaveLength(2)
  })

  // Test 9
  it('shows existing items rows when editing', () => {
    render(<ComptabiliteForm entry={entry} journals={journals} errors={{}} />)
    const libelleInputs = screen.getAllByPlaceholderText('Libellé')
    expect(libelleInputs).toHaveLength(3)
    expect((libelleInputs[0] as HTMLInputElement).value).toBe('Achat marchandises')
    expect((libelleInputs[1] as HTMLInputElement).value).toBe('TVA')
    expect((libelleInputs[2] as HTMLInputElement).value).toBe('Fournisseur')
  })

  // Test 10
  it('"Ajouter une ligne" adds a new row', async () => {
    render(<ComptabiliteForm entry={null} journals={journals} errors={{}} />)
    const addBtn = screen.getByRole('button', { name: /Ajouter une ligne/i })
    await userEvent.click(addBtn)
    const libelleInputs = screen.getAllByPlaceholderText('Libellé')
    expect(libelleInputs).toHaveLength(3)
  })

  // Test 11
  it('remove button removes a row and is disabled when only 1 row remains', async () => {
    render(<ComptabiliteForm entry={null} journals={journals} errors={{}} />)

    // Initially 2 rows — remove buttons should be enabled
    const removeButtons = screen.getAllByRole('button', { name: /Supprimer ligne/i })
    expect(removeButtons).toHaveLength(2)
    expect(removeButtons[0]).not.toBeDisabled()

    // Remove first row → 1 row left
    await userEvent.click(removeButtons[0])
    const remainingButtons = screen.getAllByRole('button', { name: /Supprimer ligne/i })
    expect(remainingButtons).toHaveLength(1)
    expect(remainingButtons[0]).toBeDisabled()
  })

  // Test 12
  it('balance shows "Équilibrée" when totalDebit == totalCredit', () => {
    const balancedEntry = {
      ...entry,
      items: [
        { id: 1, name: 'Débit', account_number: '607', real_debit: 500, real_credit: 0 },
        { id: 2, name: 'Crédit', account_number: '401', real_debit: 0, real_credit: 500 },
      ],
    }
    render(<ComptabiliteForm entry={balancedEntry} journals={journals} errors={{}} />)
    expect(screen.getByText(/Équilibrée/i)).toBeInTheDocument()
  })

  // Test 13
  it('balance shows non-zero difference when unbalanced', () => {
    const unbalancedEntry = {
      ...entry,
      items: [
        { id: 1, name: 'Débit', account_number: '607', real_debit: 1000, real_credit: 0 },
        { id: 2, name: 'Crédit', account_number: '401', real_debit: 0, real_credit: 400 },
      ],
    }
    render(<ComptabiliteForm entry={unbalancedEntry} journals={journals} errors={{}} />)
    expect(screen.getByText(/Déséquilibre/i)).toBeInTheDocument()
    expect(screen.getByText(/600\.00/)).toBeInTheDocument()
  })

  // Test 14
  it('submit calls router.post with correct data for new entry', async () => {
    render(<ComptabiliteForm entry={null} journals={journals} errors={{}} />)

    // Fill required fields
    const select = screen.getByRole('combobox')
    await userEvent.selectOptions(select, '1')

    const dateInput = screen.getByLabelText(/Date comptable/i)
    fireEvent.change(dateInput, { target: { value: '2024-05-01' } })

    const form = screen.getByRole('button', { name: /Créer l'écriture/i }).closest('form')!
    fireEvent.submit(form)

    expect(router.post).toHaveBeenCalledWith(
      '/backend/journal_entries',
      expect.any(FormData),
      expect.objectContaining({ onFinish: expect.any(Function) })
    )
    const formData = (router.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as FormData
    expect(formData.get('journal_entry[journal_id]')).toBe('1')
    expect(formData.get('journal_entry[printed_on]')).toBe('2024-05-01')
  })

  // Test 15
  it('submit calls router.patch with entry id for edit', async () => {
    render(<ComptabiliteForm entry={entry} journals={journals} errors={{}} />)

    const form = screen.getByRole('button', { name: /Enregistrer/i }).closest('form')!
    fireEvent.submit(form)

    expect(router.patch).toHaveBeenCalledWith(
      '/backend/journal_entries/42',
      expect.any(FormData),
      expect.objectContaining({ onFinish: expect.any(Function) })
    )
    const formData = (router.patch as ReturnType<typeof vi.fn>).mock.calls[0][1] as FormData
    expect(formData.get('journal_entry[journal_id]')).toBe('1')
    expect(formData.get('journal_entry[printed_on]')).toBe('2024-03-15')
    expect(formData.get('journal_entry[reference_number]')).toBe('REF-001')
  })
})
