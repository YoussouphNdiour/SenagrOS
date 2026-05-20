// app/frontend/types/reception.ts
export type ReceptionState = 'draft' | 'given'
export type ReceptionReconciliationState = 'to_reconcile' | 'reconcile'
export type ReceptionItemRole = 'merchandise' | 'fees' | 'service'

export interface ReceptionSupplier {
  id: number
  full_name: string
}

export interface ReceptionPurchaseOrder {
  id: number
  number: string
}

export interface ReceptionItem {
  id: number | null
  variant_name: string | null
  conditioning_quantity: number
  unit_pretax_amount: number
  role: ReceptionItemRole
  non_compliant: boolean
  annotation: string | null
  purchase_invoice_item_id: number | null  // null = uninvoiced
  _destroy?: boolean
}

export interface Reception {
  id: number
  number: string
  reference_number: string | null
  state: ReceptionState
  planned_at: string           // ISO date
  given_at: string | null      // ISO date — null when draft
  supplier: ReceptionSupplier
  purchase_order: ReceptionPurchaseOrder | null
  reconciliation_state: ReceptionReconciliationState
  pretax_amount: number
  currency: string
  items: ReceptionItem[]
  destroyable: boolean
  invoiceable: boolean         // = reconciliation_state === 'to_reconcile' && state === 'given'
}

export interface ReceptionsIndexProps {
  receptions: Reception[]
  filters: { q?: string; state?: ReceptionState[] }
  meta: { current_page: number; total_pages: number; total_count: number }
}

export interface ReceptionsShowProps {
  reception: Reception
}

export interface ReceptionsFormProps {
  reception: Partial<Reception> & { id?: number }
  purchase_orders: ReceptionPurchaseOrder[]
  errors: Record<string, string[]>
}
