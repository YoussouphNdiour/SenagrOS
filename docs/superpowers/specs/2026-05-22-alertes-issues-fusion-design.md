# Alertes + Issues Fusion — Design Spec

## Goal

Fusionner les Issues Ekylibre (problèmes terrain persistés en base) dans le module Alertes existant : afficher les issues ouvertes dans l'AlertesIndex, et ajouter Show + Form pour créer/modifier des issues.

## Architecture

### Fichiers modifiés

| Fichier | Changement |
|---|---|
| `app/controllers/backend/alerts_controller.rb` | Ajouter `issues` prop (10 issues ouvertes triées par gravité desc) |
| `app/controllers/backend/issues_controller.rb` | Ajouter `layout 'inertia', only: %i[show new edit]` + override `show/new/create/edit/update` |
| `app/frontend/types/alerte.ts` | Étendre `AlertesIndexProps` avec `issues: IssueItem[]` |

### Fichiers créés

| Fichier | Rôle |
|---|---|
| `app/frontend/types/issue.ts` | Types Issue : `IssueItem`, `IssueShowProps`, `IssueFormProps`, `ISSUE_NATURE_LABELS`, `ISSUE_STATE_LABELS` |
| `app/frontend/pages/Backend/Alertes/IssueShow.tsx` | Page détail issue |
| `app/frontend/pages/Backend/Alertes/IssueShow.test.tsx` | Tests IssueShow |
| `app/frontend/pages/Backend/Alertes/IssueForm.tsx` | Formulaire new/edit issue |
| `app/frontend/pages/Backend/Alertes/IssueForm.test.tsx` | Tests IssueForm |
| `app/frontend/pages/Backend/Alertes/Index.test.tsx` | Mise à jour tests Index (nouvelle section + prop issues) |

---

## Modèle Issue (existant en base)

Table `issues` — colonnes utilisées :

```
id            :integer
name          :string    (requis)
nature        :string    (requis, refers_to :IssueNature via Onoma)
gravity       :integer   (0–5, validé)
observed_at   :datetime  (requis)
state         :string    (machine à états : opened / closed / aborted)
description   :text      (optionnel)
target_type   :string    (optionnel, polymorphique)
target_id     :integer   (optionnel)
```

Machine à états : `opened` → `close` → `closed` | `abort` → `aborted` | `reopen` → `opened`

---

## AlertesIndex — section Issues

### Controller (`alerts_controller.rb`)

Ajouter à la prop `index` :

```ruby
issues = Issue.where(state: 'opened')
              .order(gravity: :desc)
              .limit(10)
              .map { |i|
                {
                  id:          i.id,
                  name:        i.name,
                  nature:      i.nature.to_s,
                  gravity:     i.gravity.to_i,
                  observed_at: i.observed_at&.to_date&.iso8601,
                  state:       i.state.to_s
                }
              }
rescue ActiveRecord::StatementInvalid, PG::Error
  issues = []
```

Ajouter `issues:` à la prop rendue.

### Frontend (`Alertes/Index.tsx`)

- Ajouter un bouton "Signaler un problème" (`href="/backend/issues/new"`) en haut à droite, à côté du titre
- Ajouter une 4ème section "Problèmes signalés" en bas de la page :
  - Si `issues.length === 0` : message "Aucun problème signalé"
  - Sinon : liste de cards avec `name`, gravité (badge 1–5 coloré), nature, date
  - Chaque item est un lien vers `/backend/issues/:id`
- Gravité couleur : 5 → `#dc2626` (rouge), 4 → `#f97316` (orange), 3 → `#f59e0b` (ambre), 1-2 → `#6b7280` (gris)

### Types (`alerte.ts`)

Ajouter à `AlertesIndexProps` :

```ts
export interface IssueItem {
  id: number
  name: string
  nature: string
  gravity: number
  observed_at: string | null
  state: string
}

// Dans AlertesIndexProps :
issues: IssueItem[]
```

---

## IssueShow

### Controller (`issues_controller.rb`)

```ruby
layout 'inertia', only: %i[show new edit]

def show
  return unless @issue = find_and_check(:issue)
  render inertia: 'Backend/Alertes/IssueShow', props: {
    issue: issue_json(@issue)
  }
end

private

def issue_json(issue)
  {
    id:          issue.id,
    name:        issue.name,
    nature:      issue.nature.to_s,
    gravity:     issue.gravity.to_i,
    observed_at: issue.observed_at&.to_date&.iso8601,
    state:       issue.state.to_s,
    description: issue.description,
    target_type: issue.target_type,
    target_id:   issue.target_id
  }
end
```

### Page (`Alertes/IssueShow.tsx`)

Affiche :
- Lien retour `← Retour aux alertes`
- Titre : `issue.name`
- Badge état : Ouvert (jaune) / Fermé (vert) / Abandonné (gris)
- Header card flex-wrap : Nature (traduite), Gravité (badge 1–5), Date observée
- Description (si présente)
- Cible (si `target_type` et `target_id`) : lien vers la ressource (ex. `/backend/products/:id` si target_type = 'Product')
- Boutons d'action : "Modifier" (`/backend/issues/:id/edit`), "Fermer" (`router.patch('/backend/issues/:id/close')`), "Abandonner" (`router.patch('/backend/issues/:id/abort')`) — affichés seulement si état = opened

### Types (`issue.ts`)

```ts
export interface IssueShowItem {
  id: number
  name: string
  nature: string
  gravity: number
  observed_at: string | null
  state: 'opened' | 'closed' | 'aborted'
  description: string | null
  target_type: string | null
  target_id: number | null
}

export interface IssueShowProps {
  issue: IssueShowItem
}
```

---

## IssueForm (new + edit)

### Controller (`issues_controller.rb`)

```ruby
def new
  render inertia: 'Backend/Alertes/IssueForm', props: {
    issue: nil,
    errors: {}
  }
end

def create
  @issue = Issue.new(
    name:        params.dig(:issue, :name),
    nature:      params.dig(:issue, :nature),
    gravity:     params.dig(:issue, :gravity).to_i,
    observed_at: params.dig(:issue, :observed_at).presence || Time.zone.now,
    description: params.dig(:issue, :description).presence,
    state:       'opened'
  )
  if @issue.save
    redirect_to backend_issue_path(@issue)
  else
    render inertia: 'Backend/Alertes/IssueForm', props: {
      issue: nil,
      errors: @issue.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first }
    }, status: :unprocessable_entity
  end
end

def edit
  return unless @issue = find_and_check(:issue)
  render inertia: 'Backend/Alertes/IssueForm', props: {
    issue: issue_json(@issue),
    errors: {}
  }
end

def update
  return unless @issue = find_and_check(:issue)
  @issue.name        = params.dig(:issue, :name) if params.dig(:issue, :name).present?
  @issue.nature      = params.dig(:issue, :nature) if params.dig(:issue, :nature).present?
  @issue.gravity     = params.dig(:issue, :gravity).to_i
  @issue.observed_at = params.dig(:issue, :observed_at).presence || @issue.observed_at
  @issue.description = params.dig(:issue, :description).presence
  if @issue.save
    redirect_to backend_issue_path(@issue)
  else
    render inertia: 'Backend/Alertes/IssueForm', props: {
      issue: issue_json(@issue),
      errors: @issue.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first }
    }, status: :unprocessable_entity
  end
end
```

### Page (`Alertes/IssueForm.tsx`)

- Lien retour `← Retour aux alertes`
- Titre : "Nouveau problème" ou "Modifier — {issue.name}"
- Champs :
  - `name` (text input, requis)
  - `nature` (select, liste ci-dessous)
  - `gravity` (boutons radio 1–5 avec couleurs)
  - `observed_at` (date, défaut aujourd'hui)
  - `description` (textarea, optionnel)
- Boutons : "Enregistrer" + "Annuler"
- Soumission : `router.post('/backend/issues', ...)` ou `router.patch('/backend/issues/:id', ...)`

### Natures incluses (sous-ensemble Afrique de l'Ouest)

```ts
// Toutes les clés sont confirmées dans Onoma::IssueNature
export const ISSUE_NATURE_LABELS: Record<string, string> = {
  accident:                         'Accident',
  climate_issue:                    'Incident climatique',
  disease:                          'Maladie',
  drought:                          'Sécheresse',
  escape:                           'Fuite d\'animaux',
  equipment_crash:                  'Accident matériel',
  empty_fuel_tank:                  'Panne sèche',
  aphid:                            'Puceron',
  caterpillar:                      'Chenilles',
  cotton_bollworm:                  'Noctuelle défoliatrice',
  bacteria_disease:                 'Bactériose',
  bacterial_disease:                'Maladie bactérienne',
  bad_vegetative_growth_conditions: 'Mauvais état végétatif',
  diarrhea:                         'Diarrhée',
  cough:                            'Toux',
}
```

### Types (`issue.ts`) suite

```ts
export interface IssueFormItem {
  id?: number
  name: string
  nature: string
  gravity: number
  observed_at: string
  description: string | null
  state?: string
}

export interface IssueFormErrors {
  name?: string
  nature?: string
  gravity?: string
  observed_at?: string
}

export interface IssueFormProps {
  issue: IssueFormItem | null
  errors: IssueFormErrors
}

export const ISSUE_STATE_LABELS: Record<string, string> = {
  opened:  'Ouvert',
  closed:  'Fermé',
  aborted: 'Abandonné',
}
```

---

## Routes

Les routes `/backend/issues` existent déjà via `manage_restfully`. Ajouter dans `routes.rb` si absent :

```ruby
namespace :backend do
  resources :issues do
    member do
      patch :close
      patch :abort
      patch :reopen
    end
  end
end
```

Vérifier que `close` et `abort` sont déjà routées (probable via `manage_restfully` ou state machine actions).

---

## Tests

### `Alertes/Index.test.tsx`
- Ajouter `issues: []` au mock par défaut
- Ajouter test : "affiche la section Problèmes signalés"
- Ajouter test : "affiche un issue dans la liste"
- Ajouter test : "affiche le bouton Signaler un problème"

### `Alertes/IssueShow.test.tsx`
- Mock `router` de `@inertiajs/react`
- Test : "affiche le nom de l'issue"
- Test : "affiche le badge état Ouvert"
- Test : "affiche les boutons Fermer et Abandonner quand état = opened"
- Test : "n'affiche pas Fermer si état = closed"

### `Alertes/IssueForm.test.tsx`
- Test : "affiche 'Nouveau problème' en mode création"
- Test : "affiche 'Modifier' en mode édition"
- Test : "le select nature contient Accident"
- Test : "affiche une erreur si name manquant"

---

## Contraintes

- Ruby 2.6 : pas de `filter_map`, pas de `then`
- TypeScript strict : pas de `any`
- CSS : Tailwind pour layout/espacement, `style={{}}` seulement pour `var(--color-*)` et hex
- `layout 'inertia'` seulement sur `show/new/edit` — `create/update` restent HAML (redirect)
