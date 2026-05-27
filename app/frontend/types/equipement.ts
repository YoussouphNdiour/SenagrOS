export interface Equipement {
  id: number
  work_number: string
  name: string
  born_at: string | null
  variant_name: string
}

export interface EquipementsIndexProps {
  equipements: Equipement[]
  meta: { total: number; page: number; per_page: number }
}

export interface EquipementDetail {
  id: number
  name: string
  work_number: string
  number: string
  identification_number: string
  description: string
  born_at: string | null
  dead_at: string | null
  variant_name: string
  type: string
}

export interface EquipementIntervention {
  id: number
  name: string
  started_at: string | null
  state: string
}

export interface EquipementMaintenance {
  id: number
  description: string
  started_at: string | null
}

export interface EquipementLink {
  id: number
  nature: string
  linked_name: string
}

export interface EquipementShowProps {
  equipement: EquipementDetail
  interventions: EquipementIntervention[]
  maintenances: EquipementMaintenance[]
  links: EquipementLink[]
  canDestroy: boolean
}

export interface EquipementFormData {
  id: number
  name: string
  work_number: string
  description: string
  born_at: string | null
  dead_at: string | null
}

export interface EquipementFormProps {
  equipement: EquipementFormData | null
  errors: Record<string, string | string[]>
}
