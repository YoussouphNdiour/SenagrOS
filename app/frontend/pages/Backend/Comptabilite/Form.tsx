import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, BookOpen, FileText, Plus, Save, X } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { ComptabiliteFormProps, JournalEntryFormItem } from '../../../types/journal_entry'

const errorStyle = {
  fontSize: '11px',
  color: 'var(--color-danger)',
  marginTop: '4px',
}

const inputStyle = {
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  outline: 'none',
}

const ComptabiliteForm = ({ entry, journals, errors }: ComptabiliteFormProps) => {
  const isEdit = entry !== null

  const [journalId, setJournalId] = useState<number | null>(entry?.journal_id ?? null)
  const [printedOn, setPrintedOn] = useState<string>(entry?.printed_on ?? '')
  const [referenceNumber, setReferenceNumber] = useState<string>(entry?.reference_number ?? '')
  const [items, setItems] = useState<JournalEntryFormItem[]>(
    entry?.items ?? [
      { id: null, name: '', account_number: '', real_debit: 0, real_credit: 0 },
      { id: null, name: '', account_number: '', real_debit: 0, real_credit: 0 },
    ]
  )
  const [submitting, setSubmitting] = useState(false)

  const addItem = () =>
    setItems(prev => [...prev, { id: null, name: '', account_number: '', real_debit: 0, real_credit: 0 }])

  const removeItem = (idx: number) =>
    setItems(prev => prev.filter((_, i) => i !== idx))

  const updateItem = (idx: number, patch: Partial<JournalEntryFormItem>) =>
    setItems(prev => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)))

  const totalDebit = items.reduce((sum, item) => sum + (item.real_debit || 0), 0)
  const totalCredit = items.reduce((sum, item) => sum + (item.real_credit || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  const buildPayload = () => {
    // Inertia's RequestPayload requires a flat Record — serialize nested items as FormData
    const formData = new FormData()
    if (journalId !== null) formData.append('journal_entry[journal_id]', String(journalId))
    if (printedOn) formData.append('journal_entry[printed_on]', printedOn)
    formData.append('journal_entry[reference_number]', referenceNumber)
    items.forEach((item, i) => {
      if (item.id !== null) formData.append(`journal_entry[items_attributes][${i}][id]`, String(item.id))
      formData.append(`journal_entry[items_attributes][${i}][name]`, item.name)
      formData.append(`journal_entry[items_attributes][${i}][account_number]`, item.account_number)
      formData.append(`journal_entry[items_attributes][${i}][real_debit]`, String(item.real_debit))
      formData.append(`journal_entry[items_attributes][${i}][real_credit]`, String(item.real_credit))
    })
    return formData
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const data = buildPayload()
    if (isEdit) {
      router.patch(`/backend/journal_entries/${entry!.id}`, data, { onFinish: () => setSubmitting(false) })
    } else {
      router.post('/backend/journal_entries', data, { onFinish: () => setSubmitting(false) })
    }
  }

  return (
    <>
      {/* Back link */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href="/backend/journal_entries"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Liste des écritures
        </a>
      </div>

      {/* Icon header + Title */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="flex items-center justify-center rounded-lg w-12 h-12 shrink-0"
          style={{ background: 'var(--color-primary-bg)' }}
        >
          <BookOpen size={22} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            {isEdit ? "Modifier l'écriture" : 'Nouvelle écriture'}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {isEdit
              ? "Modifiez les informations de l'écriture comptable."
              : "Renseignez les informations de la nouvelle écriture comptable."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Card 1 — Informations générales */}
        <div
          className="rounded-lg p-6 mb-5"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-5 flex items-center gap-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <FileText size={14} /> Informations générales
          </h2>

          <div className="flex flex-col gap-5">
            {/* Journal */}
            <div>
              <label
                htmlFor="je-journal"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Journal <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select
                id="je-journal"
                value={journalId ?? ''}
                onChange={(e) => setJournalId(e.target.value ? Number(e.target.value) : null)}
                required
                aria-invalid={!!errors.journal_id || undefined}
                aria-describedby={errors.journal_id ? 'je-journal-error' : undefined}
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
              >
                <option value="">— Choisir un journal —</option>
                {journals.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </select>
              {errors.journal_id && (
                <p id="je-journal-error" style={errorStyle}>
                  {errors.journal_id}
                </p>
              )}
            </div>

            {/* Date comptable */}
            <div>
              <label
                htmlFor="je-printed-on"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Date comptable <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="je-printed-on"
                type="date"
                value={printedOn}
                onChange={(e) => setPrintedOn(e.target.value)}
                required
                aria-invalid={!!errors.printed_on || undefined}
                aria-describedby={errors.printed_on ? 'je-printed-on-error' : undefined}
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
              />
              {errors.printed_on && (
                <p id="je-printed-on-error" style={errorStyle}>
                  {errors.printed_on}
                </p>
              )}
            </div>

            {/* N° de référence */}
            <div>
              <label
                htmlFor="je-ref"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                N° de référence
              </label>
              <input
                id="je-ref"
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                aria-invalid={!!errors.reference_number || undefined}
                aria-describedby={errors.reference_number ? 'je-ref-error' : undefined}
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
                placeholder="ex. REF-001"
              />
              {errors.reference_number && (
                <p id="je-ref-error" style={errorStyle}>
                  {errors.reference_number}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Card 2 — Lignes d'écriture */}
        <div
          className="rounded-lg mb-5"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            className="px-6 py-4 flex items-center gap-2"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <BookOpen size={16} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Lignes d&apos;écriture
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--color-bg-subtle)' }}>
                  {['Libellé', 'N° compte', 'Débit', 'Crédit', ''].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={idx}
                    style={{ borderTop: '1px solid var(--color-border)' }}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(idx, { name: e.target.value })}
                        className="w-full rounded px-2 py-1 text-sm"
                        style={inputStyle}
                        placeholder="Libellé"
                        aria-label={`Libellé ligne ${idx + 1}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.account_number}
                        onChange={(e) => updateItem(idx, { account_number: e.target.value })}
                        className="w-full rounded px-2 py-1 text-sm font-mono"
                        style={inputStyle}
                        placeholder="ex. 607"
                        aria-label={`N° compte ligne ${idx + 1}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.real_debit}
                        onChange={(e) => updateItem(idx, { real_debit: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded px-2 py-1 text-sm"
                        style={inputStyle}
                        aria-label={`Débit ligne ${idx + 1}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.real_credit}
                        onChange={(e) => updateItem(idx, { real_credit: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded px-2 py-1 text-sm"
                        style={inputStyle}
                        aria-label={`Crédit ligne ${idx + 1}`}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length <= 1}
                        aria-label={`Supprimer ligne ${idx + 1}`}
                        className="flex items-center justify-center rounded p-1"
                        style={{
                          color: items.length <= 1 ? 'var(--color-text-muted)' : 'var(--color-danger)',
                          background: 'transparent',
                          border: 'none',
                          cursor: items.length <= 1 ? 'not-allowed' : 'pointer',
                          opacity: items.length <= 1 ? 0.4 : 1,
                        }}
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr
                  style={{
                    borderTop: '2px solid var(--color-border)',
                    background: 'var(--color-bg-subtle)',
                  }}
                >
                  <td colSpan={5} className="px-4 py-2">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Débit total :{' '}
                        <strong style={{ color: 'var(--color-text)' }}>
                          {totalDebit.toFixed(2)}
                        </strong>
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Crédit total :{' '}
                        <strong style={{ color: 'var(--color-text)' }}>
                          {totalCredit.toFixed(2)}
                        </strong>
                      </span>
                      {isBalanced ? (
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: '#d1fae5', color: '#065f46' }}
                        >
                          Équilibrée ✓
                        </span>
                      ) : (
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: '#fef3c7', color: '#92400e' }}
                        >
                          Déséquilibre : {Math.abs(totalDebit - totalCredit).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="px-6 py-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium"
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              Ajouter une ligne
            </button>
          </div>

          {/* Items-level errors */}
          {(errors.items || errors['items.name'] || errors['items.account_number']) && (
            <div className="px-6 pb-4">
              {errors.items && (
                <p style={errorStyle}>{errors.items}</p>
              )}
              {errors['items.name'] && (
                <p style={errorStyle}>{errors['items.name']}</p>
              )}
              {errors['items.account_number'] && (
                <p style={errorStyle}>{errors['items.account_number']}</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-3 pt-5"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            <Save size={15} />
            {isEdit ? 'Enregistrer' : "Créer l'écriture"}
          </button>
          <a
            href="/backend/journal_entries"
            className="px-4 py-2 rounded text-sm font-medium no-underline"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            Annuler
          </a>
        </div>
      </form>
    </>
  )
}

ComptabiliteForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ComptabiliteForm
