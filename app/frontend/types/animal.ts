export interface Animal {
  id: number
  name: string
  number: string
  work_number: string
  variety: string
  born_at: string | null
  dead_at: string | null
}

export interface AnimauxIndexProps {
  animaux: Animal[]
  meta: { total: number; page: number; per_page: number }
}

export interface AnimalDetail {
  id: number
  name: string
  number: string
  work_number: string
  identification_number: string
  variety: string
  born_at: string | null
  dead_at: string | null
  description: string
}

export interface AnimalIntervention {
  id: number
  name: string
  started_at: string | null
  state: string
}

export interface AnimalShowProps {
  animal: AnimalDetail
  interventions: AnimalIntervention[]
}
