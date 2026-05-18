// app/frontend/types/vente.ts

export type VenteState = 'draft' | 'estimate' | 'aborted' | 'refused' | 'order' | 'invoice'

export interface VenteNature {
  id: number
  name: string
  currency: string
  payment_delay: string | null
}

export interface VenteTax {
  id: number
  name: string
  short_label: string
  amount: number // rate as decimal e.g. 0.18 for 18%
}

export interface VenteItem {
  id: number | null // null for new items
  variant_id: number | null
  variant_name: string | null
  conditioning_unit_id: number | null
  conditioning_unit_name: string | null
  conditioning_quantity: number
  unit_pretax_amount: number
  tax_id: number | null
  tax_rate: number // decimal e.g. 0.18
  reduction_percentage: number
  pretax_amount: number
  amount: number
  label: string | null
  annotation: string | null
  _destroy?: boolean
}

export interface VenteClient {
  id: number
  full_name: string
  number: string | null
  default_mail_address_id: number | null
}

export interface VenteAffair {
  balance: number
  closed: boolean
  incoming_payments: Array<{
    id: number
    amount: number
    paid_at: string | null
    mode_name: string | null
  }>
}

export interface VenteAddress {
  id: number
  mail_coordinate: string
}

export interface VenteShipment {
  id: number
  number: string
  state: string
  human_state_name: string
  delivery_mode: string | null
  address_coordinate: string | null
}

export interface VenteCredit {
  id: number
  number: string
  amount: number
  pretax_amount: number
  currency: string
  created_at: string
}

export interface Vente {
  id: number
  number: string
  reference_number: string | null
  initial_number: string | null
  state: VenteState
  state_label: string
  currency: string
  pretax_amount: number
  amount: number
  affair_balance: number | null
  affair_closed: boolean | null
  invoiced_at: string | null
  confirmed_at: string | null
  created_at: string
  payment_delay: string | null
  description: string | null
  client: VenteClient
  client_number: string | null
  responsible_id: number | null
  responsible_name: string | null
  nature_id: number | null
  nature_name: string | null
  address: VenteAddress | null
  invoice_address: VenteAddress | null
  items: VenteItem[]
  affair: VenteAffair | null
  shipments: VenteShipment[]
  credits: VenteCredit[]
  updateable: boolean
  destroyable: boolean
  cancellable: boolean
  can_generate_parcel: boolean
}

export interface VenteMeta {
  total: number
  page: number
  per_page: number
}

export interface VenteFilters {
  q: string | null
  state: VenteState[]
  period: string | null
  started_on: string | null
  stopped_on: string | null
  nature: 'all' | 'unpaid'
  responsible_id: number | null
}

export interface VenteResponsible {
  id: number
  label: string
}

export interface VentesIndexProps {
  sales: Array<{
    id: number
    number: string
    reference_number: string | null
    state: VenteState
    state_label: string
    client_name: string
    created_at: string
    invoiced_at: string | null
    pretax_amount: number
    amount: number
    currency: string
    updateable: boolean
    destroyable: boolean
    cancellable: boolean
  }>
  meta: VenteMeta
  filters: VenteFilters
  responsibles: VenteResponsible[]
  natures: VenteNature[]
}

export interface VentesShowProps {
  sale: Vente
}

export interface VentesFormProps {
  sale: {
    id: number | null
    number: string | null
    state: VenteState | null
    nature_id: number | null
    client_id: number | null
    client_name: string | null
    invoiced_at: string | null
    reference_number: string | null
    responsible_id: number | null
    responsible_name: string | null
    payment_delay: string | null
    description: string | null
    currency: string
    items: VenteItem[]
  }
  natures: VenteNature[]
  taxes: VenteTax[]
  errors: Record<string, string[]>
}
