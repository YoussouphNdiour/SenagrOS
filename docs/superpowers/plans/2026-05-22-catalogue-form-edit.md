# Catalogue Form (edit) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer l'action `edit` du Catalogue (`/backend/products/:id/edit`) de HAML vers React/Inertia, avec formulaire de mise à jour polymorph (Animal/Équipement/Matière/Plante).

**Architecture:** On ajoute `edit` à `layout 'inertia'` dans `products_controller.rb`, et on override `edit` + `update` AVANT la ligne `manage_restfully` (ligne 202). La page React `Catalogue/Form.tsx` reprend le pattern d'`Equipements/Form.tsx` : état local + `router.patch`. Les champs conditionnels (`identification_number`) s'affichent uniquement pour `produit_type === 'Animal'`.

**Tech Stack:** Rails 6 + Ruby 2.6 | React 18 + TypeScript strict | Inertia.js v2 | Tailwind CSS + CSS variables | Vitest + @testing-library/react

---

## File Map

| Fichier | Action |
|---|---|
| `app/frontend/types/catalogue.ts` | Modifier — ajouter `CatalogueFormItem`, `CatalogueFormErrors`, `CatalogueFormProps` |
| `app/frontend/pages/Backend/Catalogue/Form.tsx` | Créer — page formulaire edit produit |
| `app/frontend/pages/Backend/Catalogue/Form.test.tsx` | Créer — tests Form |
| `app/controllers/backend/products_controller.rb` | Modifier — layout + actions `edit`/`update` + méthode `produit_form_json` |

---

## Task 1: Types Catalogue Form

**Files:**
- Modify: `app/frontend/types/catalogue.ts`

- [ ] **Step 1: Ajouter les types à `catalogue.ts`**

Ouvrir `app/frontend/types/catalogue.ts` et ajouter à la fin du fichier (après `MOUVEMENT_LABELS`) :

```typescript
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

- [ ] **Step 2: TypeCheck**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main
yarn tsc --noEmit
```

Attendu : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add app/frontend/types/catalogue.ts
git commit -m "feat: add CatalogueFormItem, CatalogueFormErrors, CatalogueFormProps types"
```

---

## Task 2: Page `Catalogue/Form.tsx` + tests

**Files:**
- Create: `app/frontend/pages/Backend/Catalogue/Form.tsx`
- Create: `app/frontend/pages/Backend/Catalogue/Form.test.tsx`

- [ ] **Step 1: Écrire les tests**

Créer `app/frontend/pages/Backend/Catalogue/Form.test.tsx` :

```tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import CatalogueForm from './Form'
import type { CatalogueFormItem } from '../../../types/catalogue'

vi.mock('@inertiajs/react', () => ({
  router: { patch: vi.fn() },
}))

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

describe('CatalogueForm', () => {
  it('affiche le titre Modifier — Engrais NPK', () => {
    render(<CatalogueForm produit={mockProduit} errors={{}} />)
    expect(screen.getByRole('heading', { name: /Modifier — Engrais NPK/ })).toBeInTheDocument()
  })

  it('pré-remplit le champ name', () => {
    render(<CatalogueForm produit={mockProduit} errors={{}} />)
    expect(screen.getByDisplayValue('Engrais NPK')).toBeInTheDocument()
  })

  it('pré-remplit le numéro de travail', () => {
    render(<CatalogueForm produit={mockProduit} errors={{}} />)
    expect(screen.getByDisplayValue('W-001')).toBeInTheDocument()
  })

  it('appelle router.patch au submit', async () => {
    const { router } = await import('@inertiajs/react')
    render(<CatalogueForm produit={mockProduit} errors={{}} />)
    await userEvent.click(screen.getByRole('button', { name: /Enregistrer/ }))
    expect(router.patch).toHaveBeenCalledWith(
      '/backend/products/1',
      expect.objectContaining({ 'product[name]': 'Engrais NPK' }),
      expect.any(Object)
    )
  })

  it('affiche le champ identification_number pour un Animal', () => {
    render(<CatalogueForm produit={{ ...mockProduit, produit_type: 'Animal' }} errors={{}} />)
    expect(screen.getByLabelText(/N° identification/)).toBeInTheDocument()
  })

  it('n\'affiche pas le champ identification_number pour une Matière', () => {
    render(<CatalogueForm produit={{ ...mockProduit, produit_type: 'Matter' }} errors={{}} />)
    expect(screen.queryByLabelText(/N° identification/)).not.toBeInTheDocument()
  })

  it('affiche une erreur si name est vide (erreur serveur)', () => {
    render(<CatalogueForm produit={mockProduit} errors={{ name: 'est obligatoire' }} />)
    expect(screen.getByText('est obligatoire')).toBeInTheDocument()
  })

  it('affiche le lien Retour au catalogue', () => {
    render(<CatalogueForm produit={mockProduit} errors={{}} />)
    const link = screen.getByRole('link', { name: /Retour au catalogue/ })
    expect(link).toHaveAttribute('href', '/backend/products')
  })
})
```

- [ ] **Step 2: Vérifier que les tests échouent**

```bash
yarn vitest run app/frontend/pages/Backend/Catalogue/Form.test.tsx --reporter=verbose
```

Attendu : FAIL "Cannot find module './Form'".

- [ ] **Step 3: Créer `Form.tsx`**

Créer `app/frontend/pages/Backend/Catalogue/Form.tsx` :

```tsx
import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Save } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { CatalogueFormProps } from '../../../types/catalogue'

const errorStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-danger)',
  marginTop: '4px',
}

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  outline: 'none',
}

export default function CatalogueForm({ produit, errors }: CatalogueFormProps) {
  const [name, setName] = useState(produit.name)
  const [workNumber, setWorkNumber] = useState(produit.work_number ?? '')
  const [description, setDescription] = useState(produit.description ?? '')
  const [bornAt, setBornAt] = useState(produit.born_at ?? '')
  const [deadAt, setDeadAt] = useState(produit.dead_at ?? '')
  const [identificationNumber, setIdentificationNumber] = useState(produit.identification_number ?? '')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    const data: Record<string, string | null> = {
      'product[name]': name,
      'product[work_number]': workNumber || null,
      'product[description]': description || null,
      'product[born_at]': bornAt || null,
      'product[dead_at]': deadAt || null,
    }
    if (produit.produit_type === 'Animal') {
      data['product[identification_number]'] = identificationNumber || null
    }
    router.patch(`/backend/products/${produit.id}`, data, { onFinish: () => setSubmitting(false) })
  }

  const isAnimalOrPlant = produit.produit_type === 'Animal' || produit.produit_type === 'Plant'

  return (
    <div className="p-8 max-w-xl">
      {/* Retour */}
      <div className="mb-4">
        <a
          href="/backend/products"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={15} />
          Retour au catalogue
        </a>
      </div>

      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
        Modifier — {produit.name}
      </h1>

      <div
        className="rounded-lg p-6"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">
            {/* Nom */}
            <div>
              <label htmlFor="prod-name" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Nom <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="prod-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
                placeholder="Nom du produit"
              />
              {errors.name && <p style={errorStyle}>{errors.name}</p>}
            </div>

            {/* Numéro de travail */}
            <div>
              <label htmlFor="prod-work" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Numéro de travail
              </label>
              <input
                id="prod-work"
                type="text"
                value={workNumber}
                onChange={(e) => setWorkNumber(e.target.value)}
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
                placeholder="ex. W-001"
              />
              {errors.work_number && <p style={errorStyle}>{errors.work_number}</p>}
            </div>

            {/* Dates naissance / mort (Animal + Plant) */}
            {isAnimalOrPlant && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prod-born" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                    {produit.produit_type === 'Animal' ? 'Date de naissance' : 'Date de semis'}
                  </label>
                  <input
                    id="prod-born"
                    type="date"
                    value={bornAt}
                    onChange={(e) => setBornAt(e.target.value)}
                    className="w-full rounded px-3 py-2 text-sm"
                    style={inputStyle}
                  />
                  {errors.born_at && <p style={errorStyle}>{errors.born_at}</p>}
                </div>
                <div>
                  <label htmlFor="prod-dead" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                    {produit.produit_type === 'Animal' ? 'Date de décès' : 'Date de récolte'}
                  </label>
                  <input
                    id="prod-dead"
                    type="date"
                    value={deadAt}
                    onChange={(e) => setDeadAt(e.target.value)}
                    className="w-full rounded px-3 py-2 text-sm"
                    style={inputStyle}
                  />
                  {errors.dead_at && <p style={errorStyle}>{errors.dead_at}</p>}
                </div>
              </div>
            )}

            {/* Identification animale */}
            {produit.produit_type === 'Animal' && (
              <div>
                <label htmlFor="prod-ident" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                  N° identification
                </label>
                <input
                  id="prod-ident"
                  type="text"
                  value={identificationNumber}
                  onChange={(e) => setIdentificationNumber(e.target.value)}
                  className="w-full rounded px-3 py-2 text-sm"
                  style={inputStyle}
                  placeholder="ex. FR12345678"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label htmlFor="prod-desc" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Description
              </label>
              <textarea
                id="prod-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded px-3 py-2 text-sm"
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="Description optionnelle…"
              />
              {errors.description && <p style={errorStyle}>{errors.description}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6 pt-5" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              <Save size={15} />
              Enregistrer
            </button>
            <a
              href={`/backend/products/${produit.id}`}
              className="px-4 py-2 rounded text-sm font-medium no-underline"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              Annuler
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

CatalogueForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

- [ ] **Step 4: Vérifier que les tests passent**

```bash
yarn vitest run app/frontend/pages/Backend/Catalogue/Form.test.tsx --reporter=verbose
```

Attendu : 8 tests PASS.

- [ ] **Step 5: TypeCheck**

```bash
yarn tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add app/frontend/pages/Backend/Catalogue/Form.tsx app/frontend/pages/Backend/Catalogue/Form.test.tsx
git commit -m "feat: add Catalogue Form page for editing products (polymorph STI)"
```

---

## Task 3: `products_controller.rb` — edit + update Inertia

**Files:**
- Modify: `app/controllers/backend/products_controller.rb`

- [ ] **Step 1: Ajouter `edit` au layout Inertia**

Dans `app/controllers/backend/products_controller.rb`, ligne 24, remplacer :

```ruby
layout 'inertia', only: %i[index show]
```

par :

```ruby
layout 'inertia', only: %i[index show edit]
```

- [ ] **Step 2: Ajouter les actions `edit` et `update` avant `manage_restfully`**

La ligne `manage_restfully` est à la ligne 202. Insérer les deux actions et la méthode privée AVANT cette ligne.

Trouver la ligne qui commence par `manage_restfully t3e:` (actuellement ligne 202) et insérer juste avant :

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

- [ ] **Step 3: Ajouter `produit_form_json` dans le bloc `private`**

Dans la section `private` (actuellement après ligne 553), ajouter après la méthode `produit_json` existante :

```ruby
      def produit_form_json(product)
        {
          id:                    product.id,
          name:                  product.name,
          produit_type:          produit_json(product)[:produit_type],
          work_number:           product.work_number.to_s.presence,
          description:           product.description,
          born_at:               product.born_at&.to_date&.iso8601,
          dead_at:               product.dead_at&.to_date&.iso8601,
          identification_number: product.identification_number.presence
        }
      end
```

Note Ruby 2.6 : `params.dig(:product, :name)` est valide. `presence` est Rails, disponible. Pas de `filter_map`, pas de `then`.

- [ ] **Step 4: TypeCheck + tous les tests Catalogue**

```bash
yarn tsc --noEmit
yarn vitest run app/frontend/pages/Backend/Catalogue/ --reporter=verbose
```

Attendu : 0 erreurs TypeScript, tous les tests Catalogue/ PASS (Form + Show + Index).

- [ ] **Step 5: Commit**

```bash
git add app/controllers/backend/products_controller.rb
git commit -m "feat: add edit/update Inertia actions to ProductsController (before manage_restfully)"
```

---

## Task 4: Tests globaux

- [ ] **Step 1: Lancer tous les tests frontend**

```bash
yarn vitest run --reporter=verbose 2>&1 | tail -40
```

Attendu : tous les tests PASS, 0 failures.

- [ ] **Step 2: TypeCheck global**

```bash
yarn tsc --noEmit
```

Attendu : aucune erreur.
