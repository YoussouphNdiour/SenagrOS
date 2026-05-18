# Équipements — Form new/edit + sous-sections Show

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer le formulaire new/edit des équipements vers React/Inertia et enrichir la page Show avec les sous-sections interventions, maintenance et liens.

**Architecture:** Pattern identique aux formulaires Parcelles/Campagnes déjà migrés : controller Rails expose `new/create/edit/update` avec `render inertia:`, page React `Form.tsx` avec `useState` local + `router.post/patch`, sous-sections enrichies directement dans `Show.tsx` via props additionnelles du controller.

**Tech Stack:** Ruby on Rails 6, Ruby 2.6, inertia_rails, React 18, TypeScript strict, Lucide React, Vitest + Testing Library.

---

## Contexte codebase

- Controller : `app/controllers/backend/equipments_controller.rb` — hérite de `Backend::MattersController`
- Layout Inertia déjà déclaré : `layout 'inertia', only: [:index, :show]` → à étendre
- Types existants : `app/frontend/types/equipement.ts` — `EquipementShowProps` déjà défini
- Show existant : `app/frontend/pages/Backend/Equipements/Show.tsx` — à enrichir
- Test setup : `app/frontend/test/setup.tsx` — mock `usePage` et `react-leaflet` déjà configurés
- Référence de design : `app/frontend/pages/Backend/Campagnes/Form.tsx` (même pattern)
- **Ruby 2.6** : jamais de `filter_map`, `then`, `yield_self`
- **TypeScript strict** : jamais de `any`, jamais de `as unknown` en code de production

## File Structure

| Fichier | Action | Rôle |
|---|---|---|
| `app/controllers/backend/equipments_controller.rb` | Modifier | Ajouter layout new/edit + actions new/create/edit/update |
| `app/frontend/types/equipement.ts` | Modifier | Ajouter `EquipementFormProps` + enrichir `EquipementShowProps` |
| `app/frontend/pages/Backend/Equipements/Form.tsx` | Créer | Formulaire new/edit |
| `app/frontend/pages/Backend/Equipements/Form.test.tsx` | Créer | Tests du formulaire |
| `app/frontend/pages/Backend/Equipements/Show.tsx` | Modifier | Ajouter sections Interventions, Maintenance, Liens |

---

## Task 1 : Controller — new/edit/create/update Inertia

**Files:**
- Modify: `app/controllers/backend/equipments_controller.rb`

- [ ] **Step 1 : Mettre à jour le layout**

Ligne 21 du fichier, remplacer :
```ruby
layout 'inertia', only: [:index, :show]
```
par :
```ruby
layout 'inertia', only: [:index, :show, :new, :edit]
```

- [ ] **Step 2 : Ajouter les actions CRUD Inertia**

Après la méthode `show` (vers ligne 150), ajouter :

```ruby
def new
  @equipment = Equipment.new
  render inertia: 'Backend/Equipements/Form', props: {
    equipement: nil,
    errors:     {}
  }
end

def create
  @equipment = Equipment.new(permitted_equipement_params)
  if @equipment.save
    redirect_to backend_equipment_path(@equipment), notice: 'Équipement créé avec succès.'
  else
    render inertia: 'Backend/Equipements/Form', props: {
      equipement: nil,
      errors:     @equipment.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first.to_s }
    }, status: :unprocessable_entity
  end
end

def edit
  return unless @equipment = find_and_check
  render inertia: 'Backend/Equipements/Form', props: {
    equipement: {
      'id'          => @equipment.id,
      'name'        => @equipment.name.to_s,
      'work_number' => @equipment.work_number.to_s,
      'description' => @equipment.description.to_s,
      'born_at'     => @equipment.born_at&.strftime('%Y-%m-%d'),
      'dead_at'     => @equipment.dead_at&.strftime('%Y-%m-%d')
    },
    errors: {}
  }
end

def update
  return unless @equipment = find_and_check
  if @equipment.update(permitted_equipement_params)
    redirect_to backend_equipment_path(@equipment), notice: 'Équipement mis à jour.'
  else
    render inertia: 'Backend/Equipements/Form', props: {
      equipement: {
        'id'          => @equipment.id,
        'name'        => @equipment.name.to_s,
        'work_number' => @equipment.work_number.to_s,
        'description' => @equipment.description.to_s,
        'born_at'     => @equipment.born_at&.strftime('%Y-%m-%d'),
        'dead_at'     => @equipment.dead_at&.strftime('%Y-%m-%d')
      },
      errors: @equipment.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first.to_s }
    }, status: :unprocessable_entity
  end
end
```

- [ ] **Step 3 : Ajouter permitted_equipement_params en bas du fichier**

Dans la section `private` (ou `protected`) en bas du fichier, ajouter :

```ruby
private

  def permitted_equipement_params
    params.require(:equipement).permit(:name, :work_number, :description, :born_at, :dead_at)
  end
```

- [ ] **Step 4 : Enrichir l'action show avec les sous-sections**

Remplacer l'action `show` existante (ligne ~119) par :

```ruby
def show
  return unless @equipment = find_and_check

  interventions = InterventionParameter
    .joins(:intervention)
    .where(product_id: @equipment.id)
    .where("interventions.nature = ? AND interventions.procedure_name != ?", 'record', Procedo::Procedure.find(:equipment_maintenance).name)
    .order('interventions.started_at DESC')
    .limit(20)
    .map do |ip|
      {
        'id'         => ip.intervention.id,
        'name'       => ip.intervention.name.to_s,
        'started_at' => ip.intervention.started_at&.iso8601,
        'state'      => ip.intervention.state.to_s
      }
    end

  maintenances = InterventionParameter
    .joins(:intervention)
    .where(product_id: @equipment.id, type: 'InterventionTarget')
    .where("interventions.nature = ? AND interventions.procedure_name = ?", 'record', Procedo::Procedure.find(:equipment_maintenance).name)
    .order('interventions.started_at DESC')
    .limit(10)
    .map do |ip|
      {
        'id'          => ip.intervention.id,
        'description' => ip.intervention.description.to_s,
        'started_at'  => ip.intervention.started_at&.iso8601
      }
    end

  links = ProductLink.where(product_id: @equipment.id).map do |l|
    {
      'id'          => l.id,
      'nature'      => l.nature.to_s,
      'linked_name' => l.linked&.name.to_s
    }
  end

  render inertia: 'Backend/Equipements/Show', props: {
    equipement: {
      'id'                    => @equipment.id,
      'name'                  => @equipment.name.to_s,
      'work_number'           => @equipment.work_number.to_s,
      'number'                => @equipment.number.to_s,
      'identification_number' => @equipment.identification_number.to_s,
      'description'           => @equipment.description.to_s,
      'born_at'               => @equipment.born_at&.iso8601,
      'dead_at'               => @equipment.dead_at&.iso8601,
      'variant_name'          => @equipment.variant&.name.to_s,
      'type'                  => @equipment.class.name.to_s
    },
    interventions:  interventions,
    maintenances:   maintenances,
    links:          links
  }
end
```

- [ ] **Step 5 : Vérifier syntaxe Ruby**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && bundle exec ruby -c app/controllers/backend/equipments_controller.rb 2>&1
```

Expected: `Syntax OK`

- [ ] **Step 6 : Commit controller**

```bash
git add app/controllers/backend/equipments_controller.rb
git commit -m "feat: add Inertia new/edit/create/update actions to EquipmentsController"
```

---

## Task 2 : Types TypeScript

**Files:**
- Modify: `app/frontend/types/equipement.ts`

- [ ] **Step 1 : Mettre à jour le fichier de types**

Remplacer le contenu de `app/frontend/types/equipement.ts` par :

```ts
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
  errors: Record<string, string>
}
```

- [ ] **Step 2 : TypeCheck**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -10
```

Expected: `Done` ou erreurs uniquement dans d'autres fichiers non liés.

- [ ] **Step 3 : Commit types**

```bash
git add app/frontend/types/equipement.ts
git commit -m "feat: extend Equipement TypeScript types for Form and Show subsections"
```

---

## Task 3 : Form.tsx — test puis implémentation

**Files:**
- Create: `app/frontend/pages/Backend/Equipements/Form.test.tsx`
- Create: `app/frontend/pages/Backend/Equipements/Form.tsx`

- [ ] **Step 1 : Écrire le test qui échoue**

```tsx
// app/frontend/pages/Backend/Equipements/Form.test.tsx
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { usePage } from '@inertiajs/react'
import EquipementsForm from './Form'

vi.mocked(usePage).mockReturnValue({
  props: {
    appShell: { farm: { name: 'Ferme' }, campaign: null, user: { name: 'Test', initials: 'T' } },
  },
  url: '/backend/equipments/new',
  component: 'Backend/Equipements/Form',
  version: '1',
  encryptHistory: false,
  clearHistory: false,
} as unknown as ReturnType<typeof usePage>)

describe('EquipementsForm — création', () => {
  it('affiche le titre "Nouvel équipement"', () => {
    render(<EquipementsForm equipement={null} errors={{}} />)
    expect(screen.getByText(/nouvel équipement/i)).toBeInTheDocument()
  })

  it('affiche le champ Nom', () => {
    render(<EquipementsForm equipement={null} errors={{}} />)
    expect(screen.getByLabelText(/^nom/i)).toBeInTheDocument()
  })

  it('affiche un bouton de soumission', () => {
    render(<EquipementsForm equipement={null} errors={{}} />)
    expect(screen.getByRole('button', { name: /créer|enregistrer/i })).toBeInTheDocument()
  })

  it('affiche un lien retour', () => {
    render(<EquipementsForm equipement={null} errors={{}} />)
    expect(screen.getByRole('link', { name: /retour|annuler/i })).toBeInTheDocument()
  })
})

describe('EquipementsForm — édition', () => {
  const equipement = {
    id: 1,
    name: 'Tracteur John Deere',
    work_number: 'TJD-01',
    description: 'Tracteur principal',
    born_at: '2020-01-15',
    dead_at: null,
  }

  it('affiche le titre "Modifier l\'équipement"', () => {
    render(<EquipementsForm equipement={equipement} errors={{}} />)
    expect(screen.getByText(/modifier/i)).toBeInTheDocument()
  })

  it('pré-remplit le champ Nom', () => {
    render(<EquipementsForm equipement={equipement} errors={{}} />)
    expect(screen.getByDisplayValue('Tracteur John Deere')).toBeInTheDocument()
  })

  it('pré-remplit le numéro de travail', () => {
    render(<EquipementsForm equipement={equipement} errors={{}} />)
    expect(screen.getByDisplayValue('TJD-01')).toBeInTheDocument()
  })

  it('affiche les erreurs de validation', () => {
    render(<EquipementsForm equipement={null} errors={{ name: 'est vide' }} />)
    expect(screen.getByText('est vide')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Lancer le test — vérifier qu'il échoue**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Equipements/Form.test.tsx --reporter=verbose 2>&1 | tail -5
```

Expected: `Cannot find module './Form'`

- [ ] **Step 3 : Créer Form.tsx**

```tsx
// app/frontend/pages/Backend/Equipements/Form.tsx
import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Save, Tractor } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { EquipementFormProps } from '../../../types/equipement'

function EquipementsForm({ equipement, errors }: EquipementFormProps) {
  const isEdit = equipement !== null

  const [name, setName]            = useState(equipement?.name ?? '')
  const [workNumber, setWorkNumber] = useState(equipement?.work_number ?? '')
  const [description, setDescription] = useState(equipement?.description ?? '')
  const [bornAt, setBornAt]        = useState(equipement?.born_at ?? '')
  const [deadAt, setDeadAt]        = useState(equipement?.dead_at ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { equipement: { name, work_number: workNumber, description, born_at: bornAt || null, dead_at: deadAt || null } }
    if (isEdit) {
      router.patch(`/backend/equipments/${equipement.id}`, data)
    } else {
      router.post('/backend/equipments', data)
    }
  }

  const fieldStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-card)',
    color: 'var(--color-text)',
    fontSize: '13px',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.4px',
  }

  const errorStyle = {
    fontSize: '11px',
    color: '#DC2626',
    marginTop: '4px',
  }

  return (
    <>
      {/* Back */}
      <div style={{ marginBottom: '20px' }}>
        <a
          href="/backend/equipments"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '13px' }}
        >
          <ArrowLeft size={15} />
          Liste des équipements
        </a>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '40px', height: '40px', background: '#d1fae5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Tractor size={20} style={{ color: '#065f46' }} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: 'var(--color-text)' }}>
          {isEdit ? 'Modifier l\'équipement' : 'Nouvel équipement'}
        </h1>
      </div>

      {/* Form */}
      <div style={{ maxWidth: '640px', background: 'var(--color-bg-card)', borderRadius: '8px', border: '1px solid var(--color-border)', padding: '24px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Nom */}
            <div>
              <label htmlFor="eq-name" style={labelStyle}>Nom *</label>
              <input
                id="eq-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={fieldStyle}
                placeholder="ex : Tracteur John Deere 6120"
              />
              {errors.name && <p style={errorStyle}>{errors.name}</p>}
            </div>

            {/* Numéro de travail */}
            <div>
              <label htmlFor="eq-work" style={labelStyle}>Numéro de travail</label>
              <input
                id="eq-work"
                type="text"
                value={workNumber}
                onChange={e => setWorkNumber(e.target.value)}
                style={fieldStyle}
                placeholder="ex : TJD-01"
              />
              {errors.work_number && <p style={errorStyle}>{errors.work_number}</p>}
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="eq-born" style={labelStyle}>Date de mise en service</label>
                <input
                  id="eq-born"
                  type="date"
                  value={bornAt}
                  onChange={e => setBornAt(e.target.value)}
                  style={fieldStyle}
                />
                {errors.born_at && <p style={errorStyle}>{errors.born_at}</p>}
              </div>
              <div>
                <label htmlFor="eq-dead" style={labelStyle}>Date de retrait</label>
                <input
                  id="eq-dead"
                  type="date"
                  value={deadAt}
                  onChange={e => setDeadAt(e.target.value)}
                  style={fieldStyle}
                />
                {errors.dead_at && <p style={errorStyle}>{errors.dead_at}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="eq-desc" style={labelStyle}>Description</label>
              <textarea
                id="eq-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                style={{ ...fieldStyle, resize: 'vertical' }}
                placeholder="Notes sur cet équipement…"
              />
              {errors.description && <p style={errorStyle}>{errors.description}</p>}
            </div>

          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
            <a
              href="/backend/equipments"
              style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '13px' }}
            >
              Annuler
            </a>
            <button
              type="submit"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '6px', padding: '9px 18px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            >
              <Save size={14} />
              {isEdit ? 'Enregistrer' : 'Créer l\'équipement'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

EquipementsForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default EquipementsForm
```

- [ ] **Step 4 : Lancer les tests — vérifier qu'ils passent**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Equipements/Form.test.tsx --reporter=verbose 2>&1 | tail -15
```

Expected: `8 tests passed`

- [ ] **Step 5 : TypeCheck**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -10
```

Expected: `Done` sans erreur.

- [ ] **Step 6 : Commit Form**

```bash
git add app/frontend/pages/Backend/Equipements/Form.tsx \
        app/frontend/pages/Backend/Equipements/Form.test.tsx
git commit -m "feat: add Equipements new/edit Form page (React/Inertia)"
```

---

## Task 4 : Show.tsx — enrichir avec les sous-sections

**Files:**
- Modify: `app/frontend/pages/Backend/Equipements/Show.tsx`

- [ ] **Step 1 : Remplacer Show.tsx avec les sous-sections**

Remplacer entièrement `app/frontend/pages/Backend/Equipements/Show.tsx` :

```tsx
// app/frontend/pages/Backend/Equipements/Show.tsx
import type { ReactNode } from 'react'
import { ArrowLeft, Tractor, Settings, Hash, Wrench, Link2, Shield } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { EquipementShowProps } from '../../../types/equipement'

const STATE_LABELS: Record<string, string> = {
  in_progress: 'En cours',
  done:        'Terminée',
  validated:   'Validée',
}

function EquipementShow({ equipement, interventions, maintenances, links }: EquipementShowProps) {
  const isActive = !equipement.dead_at

  return (
    <>
      {/* Back */}
      <div className="mb-6">
        <a
          href="/backend/equipments"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Retour aux équipements
        </a>
      </div>

      {/* Title */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: '48px', height: '48px', background: '#d1fae5', flexShrink: 0 }}
            >
              <Tractor size={22} style={{ color: '#065f46' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
                {equipement.name}
              </h1>
              <div className="flex gap-2 mt-1 flex-wrap">
                {equipement.work_number && (
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold"
                    style={{ background: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                  >
                    N° {equipement.work_number}
                  </span>
                )}
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={isActive
                    ? { background: '#d1fae5', color: '#065f46' }
                    : { background: '#fee2e2', color: '#991b1b' }
                  }
                >
                  {isActive ? 'Actif' : 'Retiré du service'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <a
          href={`/backend/equipments/${equipement.id}/edit`}
          className="px-3 py-1.5 rounded text-sm font-medium no-underline"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        >
          Modifier
        </a>
      </div>

      {/* Info grid */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Identification */}
        <div className="rounded-lg p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Hash size={14} /> Identification
          </h2>
          <dl className="grid grid-cols-1 gap-y-3">
            {[
              { label: 'Nom', value: equipement.name },
              { label: 'Numéro de travail', value: equipement.work_number || '—' },
              { label: 'Numéro interne', value: equipement.number || '—' },
              { label: "N° d'identification", value: equipement.identification_number || '—' },
              { label: 'Variante', value: equipement.variant_name || '—' },
              { label: 'Type', value: equipement.type || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Cycle de vie */}
        <div className="rounded-lg p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Settings size={14} /> Cycle de vie
          </h2>
          <dl className="grid grid-cols-1 gap-y-3">
            {[
              { label: 'Mis en service', value: equipement.born_at?.slice(0, 10) ?? '—' },
              { label: 'Retiré du service', value: equipement.dead_at?.slice(0, 10) ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value}</dd>
              </div>
            ))}
          </dl>
          {equipement.description && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <dt className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Description</dt>
              <dd className="text-sm" style={{ color: 'var(--color-text)' }}>{equipement.description}</dd>
            </div>
          )}
        </div>
      </div>

      {/* Section Interventions sur le terrain */}
      <div className="rounded-lg mb-4" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <Wrench size={15} style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            Interventions ({interventions.length})
          </h2>
        </div>
        {interventions.length === 0 ? (
          <p className="text-sm px-5 py-4" style={{ color: 'var(--color-text-muted)' }}>Aucune intervention enregistrée.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Intervention', 'Date', 'État'].map(h => (
                  <th key={h} className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {interventions.map(iv => (
                <tr key={iv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-5 py-2">
                    <a href={`/backend/interventions/${iv.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
                      {iv.name}
                    </a>
                  </td>
                  <td className="px-5 py-2" style={{ color: 'var(--color-text-muted)' }}>
                    {iv.started_at ? new Date(iv.started_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-5 py-2" style={{ color: 'var(--color-text-muted)' }}>
                    {STATE_LABELS[iv.state] ?? iv.state}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Section Maintenances */}
      <div className="rounded-lg mb-4" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <Shield size={15} style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            Maintenances ({maintenances.length})
          </h2>
        </div>
        {maintenances.length === 0 ? (
          <p className="text-sm px-5 py-4" style={{ color: 'var(--color-text-muted)' }}>Aucune maintenance enregistrée.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Intervention', 'Date'].map(h => (
                  <th key={h} className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {maintenances.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-5 py-2">
                    <a href={`/backend/interventions/${m.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
                      {m.description || `Maintenance #${m.id}`}
                    </a>
                  </td>
                  <td className="px-5 py-2" style={{ color: 'var(--color-text-muted)' }}>
                    {m.started_at ? new Date(m.started_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Section Liens */}
      {links.length > 0 && (
        <div className="rounded-lg" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <Link2 size={15} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              Liens ({links.length})
            </h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Nature', 'Lié à'].map(h => (
                  <th key={h} className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {links.map(lk => (
                <tr key={lk.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-5 py-2" style={{ color: 'var(--color-text-muted)' }}>{lk.nature}</td>
                  <td className="px-5 py-2" style={{ color: 'var(--color-text)' }}>{lk.linked_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

EquipementShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default EquipementShow
```

- [ ] **Step 2 : Mettre à jour le test Show existant**

Lire `app/frontend/pages/Backend/Equipements/Show.test.tsx` et vérifier que le mock passe les nouvelles props `interventions`, `maintenances`, `links`. Si le test ne les inclut pas, ajouter ces props au mock :

```tsx
// Ajouter au mock existant dans Show.test.tsx :
const props = {
  equipement: { /* ... champs existants ... */ },
  interventions: [],
  maintenances: [],
  links: [],
}
// Passer ces props à render(<EquipementShow {...props} />)
```

- [ ] **Step 3 : Lancer tous les tests Equipements**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Equipements/ --reporter=verbose 2>&1 | tail -20
```

Expected: tous les tests passent.

- [ ] **Step 4 : TypeCheck**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -10
```

Expected: `Done` sans erreur.

- [ ] **Step 5 : Commit Show enrichi**

```bash
git add app/frontend/pages/Backend/Equipements/Show.tsx \
        app/frontend/pages/Backend/Equipements/Show.test.tsx
git commit -m "feat: enrich Equipements Show with interventions, maintenances and links sections"
```

---

## Vérification finale

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Equipements/ --reporter=verbose 2>&1 | tail -5
```

Expected: tous les tests passent, 0 failure.
