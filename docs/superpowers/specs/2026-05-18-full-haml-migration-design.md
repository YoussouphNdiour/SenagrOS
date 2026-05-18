# Migration complète HAML → React/Inertia — Design Spec

**Date :** 2026-05-18
**Scope :** Tous les formulaires new/edit, sous-sections Show et pages imbriquées restants en HAML
**Stratégie :** Module par module, du plus simple au plus complexe

---

## Contexte

SenagrOS migre progressivement ses vues HAML vers React 18 + Inertia.js v2. Les modules suivants ont déjà leur `index` et `show` migrés (avec AppShell) :

- Dashboard, Interventions, Parcelles, Campagnes, Productions, Comptabilité, Activités, Entités, Équipements, Paramètres

Les formulaires `new/edit`, les sous-sections embarquées dans les Show, et les pages imbriquées indépendantes restent en HAML pour les 6 modules ci-dessous.

---

## Architecture globale

### Pattern controller Rails

```ruby
layout 'inertia', only: [:index, :show, :new, :edit]

def new
  render inertia: 'Backend/Module/Form', props: {
    record: nil,
    errors: {}
  }
end

def create
  @record = Model.new(permitted_params)
  if @record.save
    redirect_to backend_record_path(@record)
  else
    render inertia: 'Backend/Module/Form', props: {
      record: nil,
      errors: @record.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first.to_s }
    }, status: :unprocessable_entity
  end
end

def edit
  return unless @record = find_and_check
  render inertia: 'Backend/Module/Form', props: {
    record: record_json(@record),
    errors: {}
  }
end

def update
  return unless @record = find_and_check
  if @record.update(permitted_params)
    redirect_to backend_record_path(@record)
  else
    render inertia: 'Backend/Module/Form', props: {
      record: record_json(@record),
      errors: @record.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first.to_s }
    }, status: :unprocessable_entity
  end
end
```

**Contraintes Ruby 2.6 :** Jamais de `filter_map`, `then`, `yield_self`. Utiliser `.select { }.map { }`.

### Pattern page React (Form)

```tsx
interface ModuleFormProps {
  record: ModuleData | null
  errors: Record<string, string>
}

function ModuleForm({ record, errors }: ModuleFormProps) {
  const [name, setName] = useState(record?.name ?? '')
  // ... autres champs

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (record) {
      router.patch(`/backend/records/${record.id}`, { record: { name, ... } })
    } else {
      router.post('/backend/records', { record: { name, ... } })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* champs + erreurs */}
    </form>
  )
}

ModuleForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default ModuleForm
```

### Nested attributes (pattern React)

Pour les has_many imbriqués (items, adresses, contacts) :

```tsx
const [items, setItems] = useState<Item[]>(record?.items ?? [])

const addItem = () => setItems(prev => [...prev, { id: null, name: '', ... }])
const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))
const updateItem = (idx: number, patch: Partial<Item>) =>
  setItems(prev => prev.map((item, i) => i === idx ? { ...item, ...patch } : item))
```

Soumission : `router.post('/backend/records', { record: { items_attributes: items } })`

### Sous-sections dans Show pages

Les sous-sections actuellement rendues par les cellules HAML (`list()` blocks) sont migrées en :
- **Données déjà dans les props** → section collapsible dans la page Show existante
- **Données volumineuses** → prop séparée chargée depuis le controller avec pagination

### Pages imbriquées indépendantes

Ex : `/backend/entities/:id/addresses/new` → controller `entity_addresses_controller.rb` avec `render inertia: 'Backend/Entites/AddressForm'` + layout Inertia.

### Tokens CSS et conventions

- `var(--color-text)`, `var(--color-text-muted)`, `var(--color-border)`, `var(--color-bg-card)`, `var(--color-primary)`, `var(--font-heading)`
- Styles inline avec CSS variables (pattern SenagrOS)
- Lucide React pour toutes les icônes
- TypeScript strict : jamais de `any`
- Arrow functions, pas de class components

---

## Sous-projet 1 — Équipements

**Controller :** `app/controllers/backend/equipments_controller.rb`
**Modèle :** `Equipment` (STI de `Product`)

### Formulaire new/edit

**Fichiers :**
- Modifier : `app/controllers/backend/equipments_controller.rb` (ajouter new/edit/create/update Inertia)
- Créer : `app/frontend/pages/Backend/Equipements/Form.tsx`
- Créer : `app/frontend/pages/Backend/Equipements/Form.test.tsx`

**Champs :**
- `name` (string, requis)
- `work_number` (string, optionnel)
- `description` (text, optionnel)
- `born_at` (date, date de mise en service)
- `dead_at` (date, date de mise hors service, optionnel)

**Props Rails → React :**
```ts
interface EquipementFormProps {
  equipement: {
    id: number
    name: string
    work_number: string
    description: string
    born_at: string | null
    dead_at: string | null
  } | null
  errors: Record<string, string>
}
```

### Sous-sections Show (à enrichir dans `Show.tsx` existant)

- Liste des interventions liées (déjà partiellement dans Show — compléter avec pagination)
- Liste des composants (components list)
- Documents attachés (liens vers les PDFs)

---

## Sous-projet 2 — Activités

**Controller :** `app/controllers/backend/activities_controller.rb`
**Modèle :** `Activity`

### Formulaire new/edit

**Fichiers :**
- Modifier : `app/controllers/backend/activities_controller.rb`
- Créer : `app/frontend/pages/Backend/Activites/Form.tsx`
- Créer : `app/frontend/pages/Backend/Activites/Form.test.tsx`

**Champs :**
- `family` (select : `cereal`, `fodder`, `vegetable`, `fruit`, `vine`, `animal`, `service`, autres)
- `name` (string, requis)
- `nature` (select : `main_crop`, `intercrop`, `cover_crop`)
- `production_cycle` (select : `annual`, `perennial`)
- `with_supports` (boolean)
- `suspended` (boolean)
- `description` (text, optionnel)

**Props :**
```ts
interface ActiviteFormProps {
  activite: {
    id: number
    family: string
    name: string
    nature: string
    production_cycle: string
    with_supports: boolean
    suspended: boolean
    description: string
  } | null
  families: Array<{ value: string; label: string }>
  errors: Record<string, string>
}
```

### Sous-sections Show

- Liste des productions associées (avec lien vers chaque production)
- Budgets par campagne (tableau simplifié : campagne, débit, crédit, solde)

---

## Sous-projet 3 — Productions

**Controller :** `app/controllers/backend/activity_productions_controller.rb`
**Modèle :** `ActivityProduction`

### Formulaire new/edit

**Fichiers :**
- Modifier : `app/controllers/backend/activity_productions_controller.rb`
- Créer : `app/frontend/pages/Backend/Productions/Form.tsx`
- Créer : `app/frontend/pages/Backend/Productions/Form.test.tsx`

**Champs :**
- `activity_id` (select parmi les activités existantes, requis)
- `campaign_id` (select parmi les campagnes, requis)
- `cultivable_zone_id` (select parmi les parcelles, optionnel)
- `started_on` (date, requis)
- `stopped_on` (date, optionnel)
- `irrigated` (boolean)
- `nitrate_fixing` (boolean)
- `state` (select : `opened`, `aborted`, `finished`)

**Props :**
```ts
interface ProductionFormProps {
  production: {
    id: number
    activity_id: number
    campaign_id: number
    cultivable_zone_id: number | null
    started_on: string
    stopped_on: string | null
    irrigated: boolean
    nitrate_fixing: boolean
    state: string
  } | null
  activities: Array<{ id: number; name: string }>
  campaigns: Array<{ id: number; name: string }>
  cultivable_zones: Array<{ id: number; name: string }>
  errors: Record<string, string>
}
```

### Sous-sections Show (enrichir `Show.tsx`)

- Liste des interventions liées (table avec date, nature, état)
- Carte Leaflet de la parcelle support (si `cultivable_zone` a un geojson)

---

## Sous-projet 4 — Comptabilité (JournalEntries)

**Controller :** `app/controllers/backend/journal_entries_controller.rb`
**Modèle :** `JournalEntry` + `JournalEntryItem`

### Formulaire new/edit (nested attributes)

**Fichiers :**
- Modifier : `app/controllers/backend/journal_entries_controller.rb` (ajouter new/edit/create/update)
- Créer : `app/frontend/pages/Backend/Comptabilite/Form.tsx`
- Créer : `app/frontend/pages/Backend/Comptabilite/Form.test.tsx`

**Champs écriture parente :**
- `journal_id` (select)
- `printed_on` (date)
- `reference_number` (string, optionnel)

**Items imbriqués (nested_attributes) :**
- `name` (libellé)
- `account_id` (recherche compte par numéro)
- `real_debit` (decimal)
- `real_credit` (decimal)

**Calcul temps réel :** total débit = total crédit (équilibre comptable affiché en bas)

**Props :**
```ts
interface ComptabiliteFormProps {
  entry: {
    id: number
    journal_id: number
    printed_on: string
    reference_number: string
    items: Array<{
      id: number | null
      name: string
      account_number: string
      real_debit: number
      real_credit: number
    }>
  } | null
  journals: Array<{ id: number; name: string }>
  errors: Record<string, string>
}
```

---

## Sous-projet 5 — Entités

**Controller :** `app/controllers/backend/entities_controller.rb`
**Modèle :** `Entity`

### Formulaire new/edit (complexe)

**Fichiers :**
- Modifier : `app/controllers/backend/entities_controller.rb`
- Créer : `app/frontend/pages/Backend/Entites/Form.tsx`
- Créer : `app/frontend/pages/Backend/Entites/Form.test.tsx`
- Modifier : `app/controllers/backend/entity_addresses_controller.rb` (pages imbriquées)
- Créer : `app/frontend/pages/Backend/Entites/AddressForm.tsx`

**Champs identité :**
- `nature` (select : `contact`, `organization`)
- `title` (select optionnel)
- `first_name`, `last_name` (string)
- `full_name` / `name` pour organisations
- `born_at`, `dead_at` (dates)
- `language` (select)
- `description` (text)

**Contacts imbriqués (nested) :**
- Emails, téléphones, fax (type + valeur)
- Adresses postales (canal, rue, code postal, ville, pays)

**Props :**
```ts
interface EntiteFormProps {
  entite: {
    id: number
    nature: string
    title: string
    first_name: string
    last_name: string
    born_at: string | null
    emails: Array<{ id: number | null; coordinate: string }>
    phones: Array<{ id: number | null; coordinate: string }>
    mails: Array<{ id: number | null; coordinate: string; city: string; country: string }>
  } | null
  errors: Record<string, string>
}
```

### Sous-sections Show (enrichir `Show.tsx`)

- Timeline (ventes, achats, tâches) — chargée depuis les props
- Comptes bancaires
- Documents

### Pages imbriquées indépendantes

- `/backend/entities/:id/addresses` → `AddressForm.tsx`

---

## Sous-projet 6 — Interventions (Procedo)

**Controller :** `app/controllers/backend/interventions_controller.rb`
**Modèle :** `Intervention` — piloté par la librairie Procedo

### Approche FormBuilder dynamique

La sélection d'une procédure détermine entièrement les paramètres du formulaire. Rails expose le schéma JSON de la procédure :

```ruby
def procedure_schema
  procedure = Procedo.find(params[:procedure_name])
  render json: procedure_schema_json(procedure)
end
```

React reçoit ce schéma et génère dynamiquement les champs. Changement de procédure → `router.visit` avec `procedure_name` dans les params → nouvelles props.

**Fichiers :**
- Modifier : `app/controllers/backend/interventions_controller.rb`
- Créer : `app/frontend/pages/Backend/Interventions/Form.tsx`
- Créer : `app/frontend/components/interventions/ProcedureFormBuilder.tsx`
- Créer : `app/frontend/pages/Backend/Interventions/Form.test.tsx`

**Champs fixes :**
- `procedure_name` (select — déclenche rechargement)
- `nature` (`record` ou `request`)
- `started_at`, `stopped_at` (datetime)
- `description` (text)

**Champs dynamiques (via ProcedureFormBuilder) :**
- Intrants (`inputs`) : produit, quantité, unité
- Extrants (`outputs`) : produit, quantité
- Intervenants (`doers`) : entité, rôle, durée
- Outils (`tools`) : équipement
- Cibles (`targets`) : parcelle ou animal

**Props :**
```ts
interface InterventionFormProps {
  intervention: InterventionData | null
  procedures: Array<{ name: string; label: string }>
  procedure_schema: ProcedureSchema | null
  errors: Record<string, string>
}
```

### Sous-sections Show (enrichir `Show.tsx`)

- Coûts détaillés
- Récoltes associées (incoming_harvests)
- Paramètres techniques

### Pages imbriquées

- Participations : `/interventions/:id/participations`
- Périodes de travail : `/interventions/:id/working_periods`

---

## Ordre d'exécution

1. **Sous-projet 1** : Équipements (Form + sous-sections Show)
2. **Sous-projet 2** : Activités (Form + sous-sections Show)
3. **Sous-projet 3** : Productions (Form + sous-sections Show)
4. **Sous-projet 4** : Comptabilité (Form nested + calcul temps réel)
5. **Sous-projet 5** : Entités (Form complexe + pages imbriquées)
6. **Sous-projet 6** : Interventions (FormBuilder Procedo + pages imbriquées)

Chaque sous-projet : spec détaillée → plan → implémentation par subagents.

---

## Contraintes globales

- **Ruby 2.6** : jamais de `filter_map`, `then`, `yield_self`
- **TypeScript strict** : jamais de `any`, jamais de `as unknown` en code de production
- **CSS** : tokens CSS vars uniquement, jamais de couleurs hardcodées
- **Icônes** : Lucide React uniquement
- **Composants** : arrow functions, PAS de class components
- **Tests** : Vitest + Testing Library, mock `usePage` via `vi.mocked`
- **Commits** : Conventional Commits, TDD (test avant implémentation)
