# Activités — Form new/edit + Show subsections confirmés

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer le formulaire new/edit des activités vers React/Inertia et confirmer/enrichir la page Show avec les types mis à jour.

**Architecture:** Identique au pattern Équipements déjà établi — controller Rails expose `new/create/edit/update` via `render inertia:`, page React `Form.tsx` avec `useState` local + `router.post/patch`, types TypeScript stricts, tests Vitest TDD.

**Tech Stack:** Ruby on Rails 6, Ruby 2.6, inertia_rails, React 18, TypeScript strict, Lucide React, Vitest + Testing Library.

**Attention Ruby 2.6:** jamais de `filter_map`, `then`, `yield_self`. Utiliser `.select{}.map{}`.

---

## Contexte codebase

- Controller : `app/controllers/backend/activities_controller.rb`
  - `manage_restfully except: %i[index show]` gère actuellement new/create/edit/update via ERB
  - `layout 'inertia', only: [:index, :show]` → à étendre à `[:index, :show, :new, :edit]`
  - `show` action : **déjà migrée Inertia** avec prop `productions`
  - `after_action :open_activity, only: :create` : callback hérité, accède à `params[:campaign][:name]`, à protéger
- Types existants : `app/frontend/types/activite.ts` — `ActiviteShowProps` inline, `ActiviteProduction` a `stopped_on`
- Test setup : `app/frontend/test/setup.tsx` — mock `usePage` configuré
- Référence de design : `app/frontend/pages/Backend/Equipements/Form.tsx`

---

## File Structure

| Fichier | Action | Rôle |
|---|---|---|
| `app/controllers/backend/activities_controller.rb` | Modifier | Étendre layout + ajouter new/create/edit/update Inertia + helpers privés |
| `app/frontend/types/activite.ts` | Remplacer | Types complets avec ActiviteDetail, ActiviteFormData, ActiviteFormProps |
| `app/frontend/pages/Backend/Activites/Form.tsx` | Créer | Formulaire new/edit |
| `app/frontend/pages/Backend/Activites/Form.test.tsx` | Créer | Tests TDD du formulaire |
| `app/frontend/pages/Backend/Activites/Show.tsx` | Modifier | Adapter aux nouveaux types (suppression stopped_on dans productions) |

---

## Task 1 : Controller — new/edit/create/update Inertia

**File:** `app/controllers/backend/activities_controller.rb`

- [ ] **Step 1 — Étendre le layout**

Remplacer :
```ruby
layout 'inertia', only: [:index, :show]
```
par :
```ruby
layout 'inertia', only: [:index, :show, :new, :edit]
```

- [ ] **Step 2 — Protéger le callback open_activity**

Remplacer la ligne `after_action :open_activity, only: :create` par :
```ruby
after_action :open_activity, only: :create, unless: -> { @activity.new_record? || params[:campaign].blank? }
```

- [ ] **Step 3 — Ajouter les actions CRUD Inertia**

Insérer avant `manage_restfully` (les définitions explicites surchargent la macro) :

```ruby
def new
  @activity = Activity.new
  render inertia: 'Backend/Activites/Form', props: {
    activite:  nil,
    families:  activity_families,
    errors:    {}
  }
end

def create
  @activity = Activity.new(permitted_activite_params)
  if @activity.save
    redirect_to backend_activity_path(@activity), notice: 'Activité créée avec succès.'
  else
    render inertia: 'Backend/Activites/Form', props: {
      activite:  activite_form_props(@activity),
      families:  activity_families,
      errors:    @activity.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first.to_s }
    }, status: :unprocessable_entity
  end
end

def edit
  return unless @activity = find_and_check
  render inertia: 'Backend/Activites/Form', props: {
    activite:  activite_form_props(@activity),
    families:  activity_families,
    errors:    {}
  }
end

def update
  return unless @activity = find_and_check
  if @activity.update(permitted_activite_params)
    redirect_to backend_activity_path(@activity), notice: 'Activité mise à jour.'
  else
    render inertia: 'Backend/Activites/Form', props: {
      activite:  activite_form_props(@activity),
      families:  activity_families,
      errors:    @activity.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first.to_s }
    }, status: :unprocessable_entity
  end
end
```

- [ ] **Step 4 — Ajouter les méthodes privées**

Dans la section `private` (après `open_activity`), ajouter :

```ruby
def activite_form_props(activity)
  {
    'id'               => activity.id,
    'family'           => activity.family.to_s,
    'name'             => activity.name.to_s,
    'nature'           => activity.nature.to_s,
    'production_cycle' => activity.production_cycle.to_s,
    'with_supports'    => activity.with_supports,
    'suspended'        => activity.suspended,
    'description'      => activity.description.to_s
  }
end

def activity_families
  Activity.family.values.map { |v| { 'value' => v.to_s, 'label' => v.to_s.humanize } }
end

def permitted_activite_params
  params.require(:activite).permit(:family, :name, :nature, :production_cycle, :with_supports, :suspended, :description)
end
```

- [ ] **Step 5 — Vérifier la syntaxe Ruby**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && bundle exec ruby -c app/controllers/backend/activities_controller.rb 2>&1
```

Expected: `Syntax OK`

- [ ] **Step 6 — Commit controller**

```bash
git add app/controllers/backend/activities_controller.rb
git commit -m "feat: add Inertia new/edit/create/update actions to ActivitiesController"
```

---

## Task 2 : Types TypeScript

**File:** `app/frontend/types/activite.ts`

- [ ] **Step 1 — Remplacer le contenu**

```ts
export interface Activite {
  id: number
  name: string
  family: string
  nature: string
  suspended: boolean
}

export interface ActivitesIndexProps {
  activites: Activite[]
  meta: { total: number; page: number; per_page: number }
}

export interface ActiviteProduction {
  id: number
  name: string
  state: string
  started_on: string | null
  campaign_name: string
  cultivable_zone_name: string
}

export interface ActiviteDetail {
  id: number
  family: string
  name: string
  nature: string
  production_cycle: string
  with_supports: boolean
  suspended: boolean
  description: string
  with_cultivation: boolean
  support_variety: string
  cultivation_variety: string
  production_started_on: string | null
  production_stopped_on: string | null
  productions_count: number
}

export interface ActiviteShowProps {
  activite: ActiviteDetail
  productions: ActiviteProduction[]
}

export interface ActiviteFormData {
  id: number
  family: string
  name: string
  nature: string
  production_cycle: string
  with_supports: boolean
  suspended: boolean
  description: string
}

export interface ActiviteFormProps {
  activite: ActiviteFormData | null
  families: Array<{ value: string; label: string }>
  errors: Record<string, string>
}
```

- [ ] **Step 2 — TypeCheck**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -10
```

Si des erreurs sur `stopped_on` dans `Show.tsx`, c'est attendu — résolu en Task 4.

- [ ] **Step 3 — Commit types**

```bash
git add app/frontend/types/activite.ts
git commit -m "feat: extend Activite TypeScript types for Form and updated Show interfaces"
```

---

## Task 3 : Form.tsx — TDD

**Files:**
- Créer : `app/frontend/pages/Backend/Activites/Form.test.tsx`
- Créer : `app/frontend/pages/Backend/Activites/Form.tsx`

- [ ] **Step 1 — Écrire le test**

```tsx
// app/frontend/pages/Backend/Activites/Form.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { usePage } from '@inertiajs/react'
import ActivitesForm from './Form'

beforeEach(() => {
  vi.mocked(usePage).mockReturnValue({
    props: {
      appShell: { farm: { name: 'Ferme Test' }, campaign: null, user: { name: 'Test', initials: 'T' } },
    },
    url: '/backend/activities/new',
    component: 'Backend/Activites/Form',
    version: '1',
    encryptHistory: false,
    clearHistory: false,
  } as unknown as ReturnType<typeof usePage>)
})

const FAMILIES = [
  { value: 'plant_farming',  label: 'Plant farming' },
  { value: 'animal_farming', label: 'Animal farming' },
]

describe('ActivitesForm — création', () => {
  it('affiche le titre "Nouvelle activité"', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByText(/nouvelle activité/i)).toBeInTheDocument()
  })

  it('affiche le champ Nom', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByLabelText(/^nom/i)).toBeInTheDocument()
  })

  it('affiche le select Famille', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByLabelText(/famille/i)).toBeInTheDocument()
  })

  it('affiche le select Nature', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByLabelText(/nature/i)).toBeInTheDocument()
  })

  it('affiche le select Cycle de production', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByLabelText(/cycle/i)).toBeInTheDocument()
  })

  it('affiche la checkbox Avec supports', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByLabelText(/avec supports/i)).toBeInTheDocument()
  })

  it('affiche la checkbox Suspendue', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByLabelText(/suspendue/i)).toBeInTheDocument()
  })

  it('affiche un bouton de soumission', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByRole('button', { name: /créer|enregistrer/i })).toBeInTheDocument()
  })

  it('affiche un lien Annuler', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{}} />)
    expect(screen.getByRole('link', { name: /annuler/i })).toBeInTheDocument()
  })
})

describe('ActivitesForm — édition', () => {
  const activite = {
    id: 1,
    name: 'Culture du mil',
    family: 'plant_farming',
    nature: 'main',
    production_cycle: 'annual',
    with_supports: false,
    suspended: false,
    description: 'Culture principale hivernage',
  }

  it('affiche le titre "Modifier"', () => {
    render(<ActivitesForm activite={activite} families={FAMILIES} errors={{}} />)
    expect(screen.getByText(/modifier/i)).toBeInTheDocument()
  })

  it('pré-remplit le champ Nom', () => {
    render(<ActivitesForm activite={activite} families={FAMILIES} errors={{}} />)
    expect(screen.getByDisplayValue('Culture du mil')).toBeInTheDocument()
  })

  it('pré-remplit la description', () => {
    render(<ActivitesForm activite={activite} families={FAMILIES} errors={{}} />)
    expect(screen.getByDisplayValue('Culture principale hivernage')).toBeInTheDocument()
  })

  it('affiche les erreurs de validation', () => {
    render(<ActivitesForm activite={null} families={FAMILIES} errors={{ name: 'est vide' }} />)
    expect(screen.getByText('est vide')).toBeInTheDocument()
  })

  it('le layout persistant est défini', () => {
    expect(typeof ActivitesForm.layout).toBe('function')
  })
})
```

- [ ] **Step 2 — Vérifier échec**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Activites/Form.test.tsx --reporter=verbose 2>&1 | tail -5
```

Expected: `Cannot find module './Form'`

- [ ] **Step 3 — Créer Form.tsx**

```tsx
// app/frontend/pages/Backend/Activites/Form.tsx
import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Save, Sprout } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { ActiviteFormProps } from '../../../types/activite'

const errorStyle = {
  fontSize: '11px',
  color: 'var(--color-danger)',
  marginTop: '4px',
}

const fieldStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  fontSize: '13px',
} as const

const NATURE_OPTIONS = [
  { value: 'main',       label: 'Principale' },
  { value: 'auxiliary',  label: 'Auxiliaire' },
  { value: 'standalone', label: 'Autonome' },
]

const CYCLE_OPTIONS = [
  { value: 'annual',    label: 'Annuel' },
  { value: 'perennial', label: 'Pérenne' },
]

const ActivitesForm = ({ activite, families, errors }: ActiviteFormProps) => {
  const isEdit = activite !== null

  const [family,          setFamily]          = useState<string>(activite?.family          ?? '')
  const [name,            setName]            = useState<string>(activite?.name            ?? '')
  const [nature,          setNature]          = useState<string>(activite?.nature          ?? 'main')
  const [productionCycle, setProductionCycle] = useState<string>(activite?.production_cycle ?? 'annual')
  const [withSupports,    setWithSupports]    = useState<boolean>(activite?.with_supports   ?? false)
  const [suspended,       setSuspended]       = useState<boolean>(activite?.suspended       ?? false)
  const [description,     setDescription]     = useState<string>(activite?.description     ?? '')
  const [submitting,      setSubmitting]      = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const data = {
      activite: { family, name, nature, production_cycle: productionCycle, with_supports: withSupports, suspended, description },
    }
    if (isEdit) {
      router.patch(`/backend/activities/${activite.id}`, data, { onFinish: () => setSubmitting(false) })
    } else {
      router.post('/backend/activities', data, { onFinish: () => setSubmitting(false) })
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <a href="/backend/activities" className="flex items-center gap-1 text-sm no-underline" style={{ color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={16} />
          Liste des activités
        </a>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center justify-center rounded-lg w-12 h-12 shrink-0" style={{ background: 'var(--color-success-bg)' }}>
          <Sprout size={22} style={{ color: 'var(--color-success-text)' }} />
        </div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
          {isEdit ? "Modifier l'activité" : 'Nouvelle activité'}
        </h1>
      </div>

      <div className="rounded-lg p-6" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">

            <div>
              <label htmlFor="act-family" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Famille <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select id="act-family" value={family} onChange={e => setFamily(e.target.value)} required
                aria-invalid={!!errors.family || undefined} aria-describedby={errors.family ? 'act-family-error' : undefined}
                style={fieldStyle}>
                <option value="">— Choisir —</option>
                {families.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              {errors.family && <p id="act-family-error" style={errorStyle}>{errors.family}</p>}
            </div>

            <div>
              <label htmlFor="act-name" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Nom <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input id="act-name" type="text" value={name} onChange={e => setName(e.target.value)} required
                aria-invalid={!!errors.name || undefined} aria-describedby={errors.name ? 'act-name-error' : undefined}
                style={fieldStyle} placeholder="ex. Culture du mil" />
              {errors.name && <p id="act-name-error" style={errorStyle}>{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="act-nature" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Nature</label>
                <select id="act-nature" value={nature} onChange={e => setNature(e.target.value)}
                  aria-invalid={!!errors.nature || undefined} aria-describedby={errors.nature ? 'act-nature-error' : undefined}
                  style={fieldStyle}>
                  {NATURE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {errors.nature && <p id="act-nature-error" style={errorStyle}>{errors.nature}</p>}
              </div>
              <div>
                <label htmlFor="act-cycle" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Cycle de production</label>
                <select id="act-cycle" value={productionCycle} onChange={e => setProductionCycle(e.target.value)}
                  aria-invalid={!!errors.production_cycle || undefined} aria-describedby={errors.production_cycle ? 'act-cycle-error' : undefined}
                  style={fieldStyle}>
                  {CYCLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {errors.production_cycle && <p id="act-cycle-error" style={errorStyle}>{errors.production_cycle}</p>}
              </div>
            </div>

            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <input id="act-supports" type="checkbox" checked={withSupports} onChange={e => setWithSupports(e.target.checked)} />
                <label htmlFor="act-supports" className="text-sm" style={{ color: 'var(--color-text)', cursor: 'pointer' }}>Avec supports</label>
              </div>
              <div className="flex items-center gap-2">
                <input id="act-suspended" type="checkbox" checked={suspended} onChange={e => setSuspended(e.target.checked)} />
                <label htmlFor="act-suspended" className="text-sm" style={{ color: 'var(--color-text)', cursor: 'pointer' }}>Suspendue</label>
              </div>
            </div>

            <div>
              <label htmlFor="act-desc" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Description</label>
              <textarea id="act-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3}
                aria-invalid={!!errors.description || undefined} aria-describedby={errors.description ? 'act-desc-error' : undefined}
                style={{ ...fieldStyle, resize: 'vertical' }} placeholder="Description facultative…" />
              {errors.description && <p id="act-desc-error" style={errorStyle}>{errors.description}</p>}
            </div>

          </div>

          <div className="flex items-center gap-3 mt-6 pt-5" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
              style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              <Save size={15} />
              {isEdit ? 'Enregistrer' : "Créer l'activité"}
            </button>
            <a href="/backend/activities" className="px-4 py-2 rounded text-sm font-medium no-underline"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
              Annuler
            </a>
          </div>
        </form>
      </div>
    </>
  )
}

ActivitesForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ActivitesForm
```

- [ ] **Step 4 — Vérifier passage des tests**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Activites/Form.test.tsx --reporter=verbose 2>&1 | tail -15
```

Expected: 14 tests passed

- [ ] **Step 5 — TypeCheck**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -5
```

Expected: `Done in ...s.`

- [ ] **Step 6 — Commit**

```bash
git add app/frontend/pages/Backend/Activites/Form.tsx app/frontend/pages/Backend/Activites/Form.test.tsx
git commit -m "feat: add Activites new/edit Form page (React/Inertia)"
```

---

## Task 4 : Show.tsx — adapter types + supprimer stopped_on

**File:** `app/frontend/pages/Backend/Activites/Show.tsx`

- [ ] **Step 1 — Lire le Show.tsx actuel pour identifier les lignes stopped_on**

```bash
grep -n "stopped_on\|Fin" /Users/yusper/Downloads/SenagrOS/ekylibre-main/app/frontend/pages/Backend/Activites/Show.tsx
```

- [ ] **Step 2 — Supprimer la colonne "Fin" et stopped_on**

Dans la table productions :
- Supprimer `'Fin'` du tableau des en-têtes de colonnes
- Supprimer la cellule `<td>` correspondant à `p.stopped_on`

- [ ] **Step 3 — Vérifier les tests Show existants**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Activites/Show.test.tsx --reporter=verbose 2>&1 | tail -15
```

Expected: tous les tests passent.

- [ ] **Step 4 — Lancer tous les tests Activites**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Activites/ --reporter=verbose 2>&1 | tail -20
```

Expected: tous les tests passent.

- [ ] **Step 5 — TypeCheck final**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -5
```

Expected: `Done` sans erreur.

- [ ] **Step 6 — Commit**

```bash
git add app/frontend/pages/Backend/Activites/Show.tsx
git commit -m "feat: update Activites Show — remove stopped_on column, align with ActiviteDetail types"
```

---

## Vérification finale

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Activites/ --reporter=verbose 2>&1 | tail -5
```

Expected: tous les tests passent, 0 failure.
