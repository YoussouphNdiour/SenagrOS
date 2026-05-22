export interface PurchaseLine {
  id: number
  label: string
  quantity: number
  pretax_amount: number
  currency: string
  purchase_number: string
}

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

export interface ReceptionLine {
  id: number
  product_name: string
  quantity: number
  parcel_number: string
}

export interface BudgetShowProps {
  budget: ProjectBudget
  purchase_lines: PurchaseLine[]
  total_pretax_amount: number
  reception_lines: ReceptionLine[]
}

export interface BudgetFormProps {
  budget: ProjectBudget
  errors: ProjectBudgetFormErrors
  mode: 'new' | 'edit'
}
