# SenagrOS — Full CRUD Workflows Design

**Date:** 2026-05-26
**Branch:** feat/dashboard-inertia-react
**Scope:** Complete A-Z CRUD for all 17 modules via Inertia/React GUI

---

## Goal

Wire up full Create/Read/Update/Delete workflows for every module, including:
- `destroy` actions (missing from almost all controllers)
- Campagnes Form controller wiring (new/create/edit/update)
- Inline field errors + global FlashBanner on form validation failure
- `canDestroy` prop disabling delete buttons when dependencies exist

---

## Architecture

Three sequential passes, each parallelisable across modules via sub-agents.

```
Pass 1 (Rails)          Pass 2 (React)          Pass 3 (QA)
──────────────────      ──────────────────      ──────────────
destroy actions         ConfirmDeleteButton     yarn tsc --noEmit
destroyable? method     canDestroy prop         yarn vitest run
can_destroy in props    FlashBanner component   rubocop -a
Campagnes Form          inline errors           manual checklist
```

---

## Pass 1 — Rails Controllers

### Pattern `destroy` (uniform across all modules)

```ruby
def destroy
  if @resource.destroyable?
    @resource.destroy!
    redirect_to action: :index, notice: 'Supprimé avec succès.'
  else
    redirect_to action: :show, id: @resource.id,
                alert: 'Impossible de supprimer : des enregistrements liés existent.'
  end
end
```

### `destroyable?` method per model

Each model gets a `destroyable?` method checking critical `has_many` associations:

| Model | Blocking dependencies |
|---|---|
| `CultivableZone` | `interventions.any?`, `activity_productions.any?` |
| `Intervention` | linked to confirmed `Sale` or `PurchaseInvoice` |
| `ActivityProduction` | `interventions.any?` |
| `Campaign` | `activity_productions.any?` |
| `Sale` | items with invoiced state |
| `PurchaseOrder` | `receptions.any?` |
| `Animal` | `interventions.any?` |
| `Worker` | `interventions.any?`, `worker_time_logs.any?` |
| `Entity` | `sales.any?`, `purchases.any?`, `workers.any?` |
| `Equipment` | `interventions.any?` |
| `JournalEntry` | `confirmed?` state |
| `Catalog` | `catalog_items.any?` |
| `Issue` | linked interventions |
| `ProjectBudget` | budget items with data |
| `Activity` | `activity_productions.any?` |
| `Travailleur` → `Worker` | same as Worker |

Default implementation:
```ruby
# In model
def destroyable?
  # override per model — default: always destroyable
  true
end
```

### `can_destroy` in Inertia props

Every `index` and `show` action includes `can_destroy` in props:

```ruby
# index — per record in collection
render inertia: 'Backend/Parcelles/Index', props: {
  parcelles: @parcelles.map { |p| p.as_json(only: [...]).merge(can_destroy: p.destroyable?) }
}

# show — single record
render inertia: 'Backend/Parcelles/Show', props: {
  parcelle: @cultivable_zone.as_json(only: [...]),
  can_destroy: @cultivable_zone.destroyable?
}
```

### Campagnes Form wiring (currently missing)

Add to `campaigns_controller.rb`:

```ruby
def new
  @campaign = Campaign.new
  render inertia: 'Backend/Campagnes/Form', props: {
    campaign: @campaign.as_json(only: %i[id name started_on stopped_on harvest_year]),
    errors: {}
  }
end

def create
  @campaign = Campaign.new(campaign_params)
  if @campaign.save
    redirect_to backend_campaign_path(@campaign), notice: 'Campagne créée avec succès.'
  else
    render inertia: 'Backend/Campagnes/Form', props: {
      campaign: @campaign.as_json(only: %i[id name started_on stopped_on harvest_year]),
      errors: @campaign.errors.as_json
    }
  end
end

def edit
  render inertia: 'Backend/Campagnes/Form', props: {
    campaign: @campaign.as_json(only: %i[id name started_on stopped_on harvest_year]),
    errors: {}
  }
end

def update
  if @campaign.update(campaign_params)
    redirect_to backend_campaign_path(@campaign), notice: 'Campagne mise à jour.'
  else
    render inertia: 'Backend/Campagnes/Form', props: {
      campaign: @campaign.as_json(only: %i[id name started_on stopped_on harvest_year]),
      errors: @campaign.errors.as_json
    }
  end
end

private

def campaign_params
  params.require(:campaign).permit(:name, :started_on, :stopped_on, :harvest_year)
end
```

---

## Pass 2 — React Components

### `ConfirmDeleteButton` enhancements

File: `app/frontend/components/ui/ConfirmDeleteButton.tsx`

New props added:
- `canDestroy: boolean` — if `false`, renders disabled button with tooltip
- `resourceName: string` — shown in confirmation dialog

```tsx
interface ConfirmDeleteButtonProps {
  href: string
  canDestroy: boolean
  resourceName: string
  className?: string
}
```

Disabled state renders:
```tsx
<button
  disabled
  title="Des enregistrements liés empêchent la suppression"
  className="btn btn-danger opacity-50 cursor-not-allowed"
>
  <Trash2 size={16} />
  Supprimer
</button>
```

### `FlashBanner` component (new)

File: `app/frontend/components/ui/FlashBanner.tsx`

Displays a red banner with all error messages when form has validation errors.

```tsx
interface FlashBannerProps {
  errors: Record<string, string[]>
}

export function FlashBanner({ errors }: FlashBannerProps) {
  const messages = Object.values(errors).flat()
  if (messages.length === 0) return null
  return (
    <div className="flash-banner flash-banner--error" role="alert">
      <AlertCircle size={16} />
      <ul>
        {messages.map((msg, i) => <li key={i}>{msg}</li>)}
      </ul>
    </div>
  )
}
```

CSS uses existing tokens: `--color-danger`, `--color-danger-light`.

### Form.tsx pattern (uniform across all modules)

Each `Form.tsx` receives `errors` from Inertia props:

```tsx
const { record, errors = {} } = usePage<{ record: T; errors: Record<string, string[]> }>().props

return (
  <form>
    <FlashBanner errors={errors} />
    <FormField name="name" label="Nom" errors={errors} />
    {/* ... */}
  </form>
)
```

### Modules to patch (Form.tsx + Show.tsx + Index.tsx)

All 17 modules:
- Interventions, Parcelles, Productions, Comptabilité
- Ventes, Achats/Commandes, Achats/Factures, Réceptions
- Budgets, Campagnes, Activités, Entités
- Équipements, Travailleurs, Animaux, Catalogue, Alertes/Issues

---

## Pass 3 — QA & Verification

### Commands

```bash
# After Pass 1
bundle exec rubocop -a app/controllers/backend/
bundle exec rspec spec/controllers/backend/ --format progress

# After Pass 2
yarn tsc --noEmit
yarn vitest run --reporter=verbose
```

### Manual checklist per module

| Action | Expected result |
|---|---|
| Click "Nouveau" | Empty form renders |
| Submit invalid form | Inline errors + red FlashBanner |
| Submit valid form | Redirect to Show + green notice |
| Click "Modifier" | Pre-filled form renders |
| Submit valid edit | Redirect to Show + green notice |
| Click "Supprimer" (no deps) | Redirect to Index + green notice |
| Click "Supprimer" (has deps) | Button disabled + tooltip |

### Out of scope (YAGNI)

- Soft delete / archiving
- Bulk delete
- Undo/redo
- Role-based permissions (Devise handles auth)
- PDF/export actions (stay as Rails)

---

## File Impact Summary

**Rails (Pass 1):**
- `app/models/*.rb` — add `destroyable?` to ~15 models
- `app/controllers/backend/*_controller.rb` — add `destroy` to ~16 controllers
- `app/controllers/backend/campaigns_controller.rb` — add new/create/edit/update

**React (Pass 2):**
- `app/frontend/components/ui/ConfirmDeleteButton.tsx` — add `canDestroy` + `resourceName` props
- `app/frontend/components/ui/FlashBanner.tsx` — new component
- `app/frontend/components/ui/index.ts` — export FlashBanner
- `app/frontend/pages/Backend/*/Form.tsx` — wire `errors` + FlashBanner (17 files)
- `app/frontend/pages/Backend/*/Show.tsx` — wire `canDestroy` to ConfirmDeleteButton (17 files)
- `app/frontend/pages/Backend/*/Index.tsx` — wire `canDestroy` per row (17 files)

**Tests (Pass 3):**
- `app/frontend/components/ui/FlashBanner.test.tsx` — new
- `app/frontend/components/ui/ConfirmDeleteButton.test.tsx` — update existing
