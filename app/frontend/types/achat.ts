// app/frontend/types/achat.ts

export type CommandeState = 'opened' | 'closed'
export type ReconciliationState = 'to_reconcile' | 'reconcile' | 'accepted'

export interface AchatNature {
  id: number
  name: string
  currency: string
  payment_delay: string | null
}

export interface AchatTax {
  id: number
  name: string
  short_label: string
  amount: number  // rate as decimal e.g. 0.18 for 18%
}

export interface AchatItem {
  id: number | null
  variant_name: string | null
  conditioning_quantity: number
  unit_pretax_amount: number
  tax_id: number | null
  reduction_percentage: number
  pretax_amount: number   // computed client-side
  amount: number          // computed client-side
  _destroy?: boolean
}

export interface AchatSupplier {
  id: number
  full_name: string
}

// --- Commandes fournisseurs ---

export interface Commande {
  id: number
  number: string
  reference_number: string | null
  state: CommandeState
  ordered_at: string
  supplier: AchatSupplier
  nature_name: string | null
  pretax_amount: number
  amount: number
  currency: string
  description: string | null
  responsible_name: string | null
  items: AchatItem[]
  receptions_count: number
  destroyable: boolean
}

export interface CommandesIndexProps {
  commandes: Commande[]
  filters: { q?: string; state?: CommandeState[] }
  meta: { current_page: number; total_pages: number; total_count: number }
}

export interface CommandesShowProps {
  commande: Commande
}

export interface CommandesFormProps {
  commande: Partial<Commande> & { id?: number }
  natures: AchatNature[]
  taxes: AchatTax[]
  errors: Record<string, string[]>
}

// --- Factures fournisseurs ---

export interface Facture {
  id: number
  number: string
  reference_number: string | null
  invoiced_at: string
  supplier: AchatSupplier
  nature_name: string | null
  pretax_amount: number
  amount: number
  currency: string
  reconciliation_state: ReconciliationState
  unpaid: boolean
  description: string | null
  payment_delay: string | null
  responsible_name: string | null
  items: AchatItem[]
  destroyable: boolean
  updatable: boolean
}

export interface FacturesIndexProps {
  factures: Facture[]
  filters: { q?: string; reconciliation_state?: ReconciliationState[]; unpaid?: boolean }
  meta: { current_page: number; total_pages: number; total_count: number }
}

export interface FacturesShowProps {
  facture: Facture
}

export interface FacturesFormProps {
  facture: Partial<Facture> & { id?: number }
  natures: AchatNature[]
  taxes: AchatTax[]
  errors: Record<string, string[]>
}
