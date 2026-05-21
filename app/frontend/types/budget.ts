export interface ProjectBudget {
  id: number
  name: string
  description: string | null
  isacompta_analytic_code: string | null
  purchase_items_count: number
  reception_items_count: number
}

export interface ProjectBudgetFormErrors {
  name?: string[]
  description?: string[]
  isacompta_analytic_code?: string[]
}

export interface BudgetsIndexProps {
  budgets: ProjectBudget[]
  meta: {
    total: number
    page: number
    per_page: number
  }
}

export interface BudgetShowProps {
  budget: ProjectBudget
}

export interface BudgetFormProps {
  budget: ProjectBudget
  errors: ProjectBudgetFormErrors
  mode: 'new' | 'edit'
}
