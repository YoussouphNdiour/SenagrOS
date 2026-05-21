import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type { BudgetFormProps } from '../../../types/budget'

export default function BudgetForm({ budget, errors, mode }: BudgetFormProps) {
  const [name, setName] = useState(budget.name ?? '')
  const [description, setDescription] = useState(budget.description ?? '')
  const [analytique, setAnalytique] = useState(budget.isacompta_analytic_code ?? '')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const data = {
      project_budget: {
        name,
        description,
        isacompta_analytic_code: analytique || null,
      },
    }
    if (mode === 'new') {
      router.post('/backend/project_budgets', data, { onFinish: () => setSubmitting(false) })
    } else {
      router.patch(`/backend/project_budgets/${budget.id}`, data, { onFinish: () => setSubmitting(false) })
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid var(--color-border)',
    borderRadius: '0.375rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
        {mode === 'new' ? 'Nouveau budget' : 'Modifier le budget'}
      </h1>

      <form
        aria-label={mode === 'new' ? 'Nouveau budget' : 'Modifier le budget'}
        onSubmit={handleSubmit}
        style={{ background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', padding: '1.5rem' }}
      >
        {/* Nom */}
        <div className="mb-4">
          <label htmlFor="budget-name" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            Nom <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            id="budget-name"
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
          />
          {errors.name && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.name[0]}</p>}
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          {errors.description && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.description[0]}</p>}
        </div>

        {/* Code analytique */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            Code analytique isacompta{' '}
            <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>(2 caractères max)</span>
          </label>
          <input
            type="text"
            maxLength={2}
            value={analytique}
            onChange={e => setAnalytique(e.target.value)}
            placeholder="ex: MA"
            style={{ ...inputStyle, width: '6rem' }}
          />
          {errors.isacompta_analytic_code && (
            <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.isacompta_analytic_code[0]}</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: 'var(--color-primary)', color: '#fff', border: 'none',
              borderRadius: '0.375rem', padding: '0.5rem 1.25rem', fontWeight: 500,
              fontSize: '0.875rem', cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={() => router.visit(
              mode === 'edit'
                ? `/backend/project_budgets/${budget.id}`
                : '/backend/project_budgets'
            )}
            style={{
              background: 'var(--color-bg-card)', color: 'var(--color-text)',
              border: '1px solid var(--color-border)', borderRadius: '0.375rem',
              padding: '0.5rem 1.25rem', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer',
            }}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}

BudgetForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
