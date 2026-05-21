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
}

export interface ProduitMovement {
  delta: number
  population: number
  started_at: string
  description: string | null
}

export interface CatalogueIndexProps {
  produits: Produit[]
  filters: { q?: string; produit_type?: ProduitType }
  meta: { total_count: number; current_page: number; total_pages: number }
}

export interface MovementFormErrors {
  delta?: string[]
  mouvement_type?: string[]
  started_at?: string[]
}

export interface CatalogueShowProps {
  produit: Produit
  movements: ProduitMovement[]
  movement_errors?: MovementFormErrors
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
