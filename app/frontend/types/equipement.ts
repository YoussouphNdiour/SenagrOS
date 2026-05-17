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
