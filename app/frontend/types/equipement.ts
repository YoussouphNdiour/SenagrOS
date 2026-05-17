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

export interface EquipementShowProps {
  equipement: {
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
}
