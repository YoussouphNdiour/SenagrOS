import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Save, Wallet } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, FlashBanner, IconBox, SectionCard, SectionTitle, FormField, PrimaryButton } from '../../../components/ui'
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

  const cancelHref = mode === 'edit'
    ? `/backend/project_budgets/${budget.id}`
    : '/backend/project_budgets'

  return (
    <>
      <BackLink href="/backend/project_budgets" label="Liste des budgets" />

      <div className="flex items-center gap-4 mb-6">
        <IconBox icon={Wallet} color="var(--color-primary)" bg="var(--color-success-bg)" />
        <div>
          <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {mode === 'new' ? 'Nouveau budget' : 'Modifier le budget'}
          </h1>
        </div>
      </div>

      <SectionCard>
        <SectionTitle icon={Wallet}>Informations du budget</SectionTitle>
        <FlashBanner errors={errors} />

        <form aria-label={mode === 'new' ? 'Nouveau budget' : 'Modifier le budget'} onSubmit={handleSubmit}>
          <div className="flex flex-col gap-5">
            <FormField label="Nom" required htmlFor="budget-name" error={Array.isArray(errors.name) ? errors.name[0] : errors.name}>
              <input id="budget-name" type="text" required value={name} onChange={e => setName(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </FormField>

            <FormField label="Description" htmlFor="budget-description" error={Array.isArray(errors.description) ? errors.description[0] : errors.description}>
              <textarea id="budget-description" value={description} onChange={e => setDescription(e.target.value)} rows={4}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </FormField>

            <FormField
              label="Code analytique isacompta"
              help="2 caractères max"
              htmlFor="budget-analytique"
              error={Array.isArray(errors.isacompta_analytic_code) ? errors.isacompta_analytic_code[0] : errors.isacompta_analytic_code}
            >
              <input id="budget-analytique" type="text" maxLength={2} value={analytique}
                onChange={e => setAnalytique(e.target.value)} placeholder="ex: MA"
                className="w-24 rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </FormField>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <PrimaryButton type="submit" disabled={submitting}>
              <Save size={15} /> {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={() => router.visit(cancelHref)}>Annuler</PrimaryButton>
          </div>
        </form>
      </SectionCard>
    </>
  )
}

BudgetForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
