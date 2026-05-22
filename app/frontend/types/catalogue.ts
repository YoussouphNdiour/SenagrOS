export type ProduitType =
  | 'Matter'
  | 'Animal'
  | 'Equipment'
  | 'Plant'
  | 'Other'

export interface Produit {
  id: number
  name: string
  number: string
  produit_type: ProduitType
  population: number
  unit_name: string
  description: string | null
  dead_at: string | null
  born_at: string | null
  geolocation: { lat: number; lng: number } | null
  sex: string | null
  identification_number: string | null
  filiation_status: string | null
}

export interface ProduitMovement {
  delta: number
  population: number
  started_at: string
  description: string | null
}

export interface CatalogueIndexProps {
  produits: Produit[]
  filters: { q?: string; produit_type?: ProduitType; etat?: 'alive' | 'dead' }
  meta: { total_count: number; current_page: number; total_pages: number }
}

export interface MovementFormErrors {
  delta?: string[]
  mouvement_type?: string[]
  started_at?: string[]
}

export interface MovementMeta {
  total: number
  page: number
  per_page: number
}

export interface InterventionItem {
  id: number
  name: string
  started_at: string | null
  nature: string
  parameter_type: string
}

export interface IssueItem {
  id: number
  name: string
  nature: string
  observed_at: string | null
  state: string
  gravity: number
}

export interface CatalogueShowProps {
  produit: Produit
  movements: ProduitMovement[]
  movement_errors?: MovementFormErrors
  movement_meta: MovementMeta
  movement_filter: string | null
  interventions: InterventionItem[]
  issues: IssueItem[]
}

export type MouvementType =
  | 'purchase'
  | 'sale'
  | 'consumption'
  | 'birth'
  | 'death'
  | 'butchery'
  | 'loan'

export const MOUVEMENT_LABELS: Record<MouvementType, string> = {
  purchase:    'Achat',
  sale:        'Vente',
  consumption: 'Consommation',
  birth:       'Naissance',
  death:       'Décès',
  butchery:    'Abattage',
  loan:        'Prêt',
}

export interface CatalogueFormItem {
  id: number
  name: string
  produit_type: ProduitType
  work_number: string | null
  description: string | null
  born_at: string | null
  dead_at: string | null
  identification_number: string | null
}

export interface CatalogueFormErrors {
  name?: string
  work_number?: string
  description?: string
  born_at?: string
  dead_at?: string
}

export interface CatalogueFormProps {
  produit: CatalogueFormItem
  errors: CatalogueFormErrors
}
