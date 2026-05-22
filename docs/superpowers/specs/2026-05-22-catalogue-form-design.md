# Catalogue Form (edit) — Design Spec

## Goal

Migrer l'action `edit` du module Catalogue (`/backend/products`) de HAML vers React/Inertia. L'action `new` reste en HAML (complexité du sélecteur de variante). Les types Animal et Équipement ont déjà leurs propres formulaires React dans leurs modules dédiés.

## Décision de périmètre

| Action | Avant | Après |
|---|---|---|
| `index` | Inertia ✅ | Inertia ✅ |
| `show` | Inertia ✅ | Inertia ✅ |
| `new` | HAML (`manage_restfully`) | HAML (inchangé — variant requis) |
| `edit` | HAML (`manage_restfully`) | **Inertia** ✅ |
| `create` | HAML | HAML (inchangé) |
| `update` | HAML | **Inertia** (override avant `manage_restfully`) |
| `destroy` | HAML (`manage_restfully`) | HAML (inchangé) |

---

## Architecture

### Fichiers modifiés

| Fichier | Changement |
|---|---|
| `app/controllers/backend/products_controller.rb` | Ajouter `edit` à `layout 'inertia'`; override `edit` + `update` avant `manage_restfully` |
| `app/frontend/types/catalogue.ts` | Ajouter `CatalogueFormProps` |

### Fichiers créés

| Fichier | Rôle |
|---|---|
| `app/frontend/pages/Backend/Catalogue/Form.tsx` | Formulaire edit produit |
| `app/frontend/pages/Backend/Catalogue/Form.test.tsx` | Tests Form |

---

## Controller (`products_controller.rb`)

### Layout

```ruby
layout 'inertia', only: %i[index show edit]
```

### Actions à ajouter AVANT `manage_restfully` (ligne 171)

```ruby
def edit
  return unless @product = find_and_check(:product)
  render inertia: 'Backend/Catalogue/Form', props: {
    produit: produit_form_json(@product),
    errors: {}
  }
end

def update
  return unless @product = find_and_check(:product)

  @product.name        = params.dig(:product, :name).presence || @product.name
  @product.work_number = params.dig(:product, :work_number).presence
  @product.description = params.dig(:product, :description).presence
  @product.born_at     = params.dig(:product, :born_at).presence
  @product.dead_at     = params.dig(:product, :dead_at).presence

  if @product.is_a?(Animal)
    @product.identification_number = params.dig(:product, :identification_number).presence
  end

  if @product.save
    redirect_to backend_product_path(@product)
  else
    render inertia: 'Backend/Catalogue/Form', props: {
      produit: produit_form_json(@product),
      errors: @product.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first }
    }, status: :unprocessable_entity
  end
end
```

### Méthode privée à ajouter

```ruby
def produit_form_json(product)
  {
    id:                   product.id,
    name:                 product.name,
    produit_type:         produit_json(product)[:produit_type],
    work_number:          product.work_number.to_s.presence,
    description:          product.description,
    born_at:              product.born_at&.to_date&.iso8601,
    dead_at:              product.dead_at&.to_date&.iso8601,
    identification_number: product.identification_number.presence
  }
end
```

---

## Types (`catalogue.ts`)

Ajouter :

```ts
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
```

---

## Page (`Catalogue/Form.tsx`)

### Structure

- Lien retour `← Retour au catalogue` (vers `/backend/products`)
- Titre : "Modifier — {produit.name}"
- Card formulaire avec :
  - `name` (text, requis)
  - `work_number` (text, optionnel)
  - `born_at` / `dead_at` (date inputs, côte à côte pour Animal/Plant)
  - `description` (textarea)
  - Si `produit.produit_type === 'Animal'` : `identification_number` (text)
- Boutons : "Enregistrer" + "Annuler" (retour show)

### Soumission

```tsx
router.patch(`/backend/products/${produit.id}`, {
  'product[name]': name,
  'product[work_number]': workNumber,
  'product[description]': description,
  'product[born_at]': bornAt,
  'product[dead_at]': deadAt,
  ...(produit.produit_type === 'Animal' ? { 'product[identification_number]': identificationNumber } : {}),
}, { onFinish: () => setSubmitting(false) })
```

### Layout

```tsx
CatalogueForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

---

## Tests (`Catalogue/Form.test.tsx`)

Mock `@inertiajs/react` : `router: { patch: vi.fn() }`

```ts
const mockProduit: CatalogueFormItem = {
  id: 1,
  name: 'Engrais NPK',
  produit_type: 'Matter',
  work_number: 'W-001',
  description: 'Description test',
  born_at: null,
  dead_at: null,
  identification_number: null,
}
```

Tests :
- "affiche le titre Modifier — Engrais NPK"
- "pré-remplit le champ name"
- "appelle router.patch au submit"
- "affiche le champ identification_number pour un Animal"
- "n'affiche pas le champ identification_number pour une Matière"
- "affiche une erreur si name est vide (erreur serveur)"

---

## Contraintes

- Ruby 2.6 : pas de `filter_map`, pas de `then`
- TypeScript strict : pas de `any`
- CSS : Tailwind pour layout/espacement, `style={{}}` seulement pour `var(--color-*)` et hex
- `manage_restfully` reste intact à la ligne 171 — les nouvelles actions `edit`/`update` sont déclarées AVANT
- Ne pas toucher aux actions `new`, `create`, `destroy` — elles restent gérées par `manage_restfully`
