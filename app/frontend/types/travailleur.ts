export interface Travailleur {
  id: number
  name: string
  number: string
  work_number: string
  born_at: string | null
  dead_at: string | null
}

export interface TravailleursIndexProps {
  travailleurs: Travailleur[]
  meta: { total: number; page: number; per_page: number }
}

export interface TravailleurDetail {
  id: number
  name: string
  number: string
  work_number: string
  identification_number: string
  born_at: string | null
  dead_at: string | null
  description: string
}

export interface TravailleurIntervention {
  id: number
  name: string
  started_at: string | null
  state: string
}

export interface TravailleurShowProps {
  travailleur: TravailleurDetail
  interventions: TravailleurIntervention[]
}
