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

export interface CatalogueShowProps {
  produit: Produit
  movements: ProduitMovement[]
}
