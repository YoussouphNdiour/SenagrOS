# Full CRUD Workflows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up complete Create/Read/Update/Delete workflows for all 17 SenagrOS modules including destroy actions, dependency checks, inline form validation errors, and flash notifications.

**Architecture:** Three sequential passes — (1) Rails controllers get `destroy` + `can_destroy` props + Campagnes Form wiring, (2) React components get `FlashBanner` + updated `ConfirmDeleteButton` + all Form/Show/Index pages updated, (3) TypeScript + tests verification.

**Tech Stack:** Ruby on Rails 6, Inertia.js v2, React 18, TypeScript strict, Lucide React, Vitest + React Testing Library.

**Working directory:** All paths are relative to `ekylibre-main/`

---

## Task 0: Flash infrastructure — base controller + AppShell

**Files:**
- Modify: `app/controllers/backend/base_controller.rb` (inertia_share block)
- Modify: `app/frontend/types/shared.ts`
- Modify: `app/frontend/components/AppShell.tsx`

- [ ] **Step 1: Add flash to inertia_share in base_controller.rb**

Find the `inertia_share` block (around line 38) and add `flash` to it:

```ruby
inertia_share do
  {
    appShell: {
      farm:     { name: safe_company_name },
      campaign: safe_campaign_json,
      user:     {
        name:     current_user&.name.to_s,
        initials: current_user&.name.to_s.split(' ').map { |w| w[0].to_s }.join
      }
    },
    flash: {
      notice: flash[:notice],
      alert:  flash[:alert]
    }
  }
end
```

- [ ] **Step 2: Update InertiaSharedProps in shared.ts**

```typescript
export interface AppShellCampaign {
  name: string
  started_on: string
  stopped_on: string
}

export interface AppShellUser {
  name: string
  initials: string
}

export interface AppShellProps {
  farm: { name: string }
  campaign: AppShellCampaign | null
  user: AppShellUser
}

export interface InertiaSharedProps {
  appShell: AppShellProps
  flash: { notice: string | null; alert: string | null }
  errors: Record<string, string>
  [key: string]: unknown
}
```

- [ ] **Step 3: Add FlashToast to AppShell**

In `AppShell.tsx`, import `useEffect` (already imported), `CheckCircle`, `AlertTriangle` from lucide-react, and add the flash toast just before `{children}`:

At the top of the file, add to lucide-react imports:
```tsx
import {
  LayoutDashboard, Wrench, Map, Sprout, BookOpen, Settings, Calendar, Users, Tractor,
  UserCog, PawPrint, Activity, ShoppingCart, ShoppingBag, Package, Bell, Wallet,
  ChevronDown, ChevronRight, Search, LogOut, User, LifeBuoy, CheckCircle, AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
```

Inside the `AppShell` component, after the existing state declarations, add:

```tsx
const flash = props.flash ?? { notice: null, alert: null }
const [visibleNotice, setVisibleNotice] = useState<string | null>(flash.notice ?? null)
const [visibleAlert, setVisibleAlert] = useState<string | null>(flash.alert ?? null)

useEffect(() => {
  setVisibleNotice(flash.notice ?? null)
  setVisibleAlert(flash.alert ?? null)
  if (flash.notice) {
    const t = setTimeout(() => setVisibleNotice(null), 4000)
    return () => clearTimeout(t)
  }
}, [flash.notice, flash.alert])
```

In the JSX, inside `<main>` just before `{children}`:

```tsx
<main style={{ flex: 1, overflowY: 'auto', padding: 'var(--layout-page-pad)' }}>
  {visibleNotice && (
    <div role="status" style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '10px 14px', marginBottom: '16px', borderRadius: '8px',
      background: 'var(--color-success-bg)', border: '1px solid var(--color-success-text)',
      color: 'var(--color-success-text)', fontSize: '14px',
    }}>
      <CheckCircle size={16} />
      {visibleNotice}
      <button onClick={() => setVisibleNotice(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>×</button>
    </div>
  )}
  {visibleAlert && (
    <div role="alert" style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '10px 14px', marginBottom: '16px', borderRadius: '8px',
      background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-text)',
      color: 'var(--color-danger-text)', fontSize: '14px',
    }}>
      <AlertTriangle size={16} />
      {visibleAlert}
      <button onClick={() => setVisibleAlert(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>×</button>
    </div>
  )}
  {children}
</main>
```

- [ ] **Step 4: Run TypeScript check**

```bash
yarn tsc --noEmit
```
Expected: no errors on shared.ts / AppShell.tsx changes.

- [ ] **Step 5: Commit**

```bash
git add app/controllers/backend/base_controller.rb \
        app/frontend/types/shared.ts \
        app/frontend/components/AppShell.tsx
git commit -m "feat: add flash notice/alert to Inertia shared props and AppShell toast"
```

---

## Task 1: FlashBanner component + ConfirmDeleteButton update

**Files:**
- Create: `app/frontend/components/ui/FlashBanner.tsx`
- Create: `app/frontend/components/ui/FlashBanner.test.tsx`
- Modify: `app/frontend/components/ui/ConfirmDeleteButton.tsx`
- Modify: `app/frontend/components/ui/index.ts`

- [ ] **Step 1: Write failing test for FlashBanner**

Create `app/frontend/components/ui/FlashBanner.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FlashBanner } from './FlashBanner'

describe('FlashBanner', () => {
  it('renders nothing when errors is empty', () => {
    const { container } = render(<FlashBanner errors={{}} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders all error messages', () => {
    render(<FlashBanner errors={{ name: ['ne peut pas être vide'], email: ['est invalide'] }} />)
    expect(screen.getByText('ne peut pas être vide')).toBeInTheDocument()
    expect(screen.getByText('est invalide')).toBeInTheDocument()
  })

  it('has role=alert for accessibility', () => {
    render(<FlashBanner errors={{ name: ['erreur'] }} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
yarn vitest run app/frontend/components/ui/FlashBanner.test.tsx
```
Expected: FAIL with "Cannot find module './FlashBanner'"

- [ ] **Step 3: Implement FlashBanner**

Create `app/frontend/components/ui/FlashBanner.tsx`:

```tsx
import { AlertCircle } from 'lucide-react'

interface FlashBannerProps {
  errors: Record<string, string | string[]>
}

export function FlashBanner({ errors }: FlashBannerProps) {
  const messages = Object.values(errors).flatMap(v => (Array.isArray(v) ? v : [v]))
  if (messages.length === 0) return null

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        padding: '10px 14px',
        marginBottom: '16px',
        borderRadius: '8px',
        background: 'var(--color-danger-bg)',
        border: '1px solid var(--color-danger-text)',
        color: 'var(--color-danger-text)',
        fontSize: '14px',
      }}
    >
      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
yarn vitest run app/frontend/components/ui/FlashBanner.test.tsx
```
Expected: 3 tests PASS.

- [ ] **Step 5: Write failing test for updated ConfirmDeleteButton**

Create `app/frontend/components/ui/ConfirmDeleteButton.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'

describe('ConfirmDeleteButton', () => {
  it('calls onDelete after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onDelete = vi.fn()
    render(<ConfirmDeleteButton onDelete={onDelete} canDestroy resourceName="cette parcelle" />)
    await userEvent.click(screen.getByRole('button'))
    expect(onDelete).toHaveBeenCalled()
  })

  it('does not call onDelete if confirm is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const onDelete = vi.fn()
    render(<ConfirmDeleteButton onDelete={onDelete} canDestroy resourceName="cette parcelle" />)
    await userEvent.click(screen.getByRole('button'))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('renders disabled when canDestroy is false', () => {
    render(<ConfirmDeleteButton onDelete={vi.fn()} canDestroy={false} resourceName="cette parcelle" />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows tooltip title when disabled', () => {
    render(<ConfirmDeleteButton onDelete={vi.fn()} canDestroy={false} resourceName="cette parcelle" />)
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Des enregistrements liés empêchent la suppression')
  })
})
```

- [ ] **Step 6: Run test — expect partial FAIL (new tests fail)**

```bash
yarn vitest run app/frontend/components/ui/ConfirmDeleteButton.test.tsx
```
Expected: FAIL on canDestroy tests.

- [ ] **Step 7: Update ConfirmDeleteButton implementation**

Replace `app/frontend/components/ui/ConfirmDeleteButton.tsx` entirely:

```tsx
import { Trash2 } from 'lucide-react'
import { PrimaryButton } from './PrimaryButton'

interface ConfirmDeleteButtonProps {
  onDelete: () => void
  canDestroy: boolean
  resourceName: string
  message?: string
  label?: string
  size?: 'sm' | 'md'
}

export function ConfirmDeleteButton({
  onDelete,
  canDestroy,
  resourceName,
  message,
  label = 'Supprimer',
  size = 'md',
}: ConfirmDeleteButtonProps) {
  const confirmMessage = message ?? `Supprimer ${resourceName} ?`

  if (!canDestroy) {
    return (
      <button
        type="button"
        disabled
        title="Des enregistrements liés empêchent la suppression"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: size === 'sm' ? '4px 10px' : '7px 14px',
          borderRadius: '8px',
          fontSize: size === 'sm' ? '12px' : '14px',
          background: 'var(--color-danger-bg)',
          color: 'var(--color-danger-text)',
          border: '1px solid var(--color-danger-text)',
          opacity: 0.45,
          cursor: 'not-allowed',
        }}
      >
        <Trash2 size={size === 'sm' ? 13 : 15} />
        {label}
      </button>
    )
  }

  function handleClick() {
    if (window.confirm(confirmMessage)) onDelete()
  }

  return (
    <PrimaryButton variant="danger" size={size} onClick={handleClick}>
      <Trash2 size={size === 'sm' ? 13 : 15} />
      {label}
    </PrimaryButton>
  )
}
```

- [ ] **Step 8: Run tests — expect PASS**

```bash
yarn vitest run app/frontend/components/ui/ConfirmDeleteButton.test.tsx
```
Expected: 4 tests PASS.

- [ ] **Step 9: Export from index.ts**

Add to `app/frontend/components/ui/index.ts`:

```ts
export { FlashBanner } from './FlashBanner'
```

- [ ] **Step 10: Commit**

```bash
git add app/frontend/components/ui/FlashBanner.tsx \
        app/frontend/components/ui/FlashBanner.test.tsx \
        app/frontend/components/ui/ConfirmDeleteButton.tsx \
        app/frontend/components/ui/ConfirmDeleteButton.test.tsx \
        app/frontend/components/ui/index.ts
git commit -m "feat: add FlashBanner component and update ConfirmDeleteButton with canDestroy"
```

---

## Task 2: Campaigns controller — Form wiring (new/create/edit/update)

**Files:**
- Modify: `app/controllers/backend/campaigns_controller.rb`

- [ ] **Step 1: Add `layout 'inertia'` for form actions**

Find the line `layout 'inertia', only: [:index, :show]` (line 23) and change it to:

```ruby
layout 'inertia', only: [:index, :show, :new, :edit]
```

- [ ] **Step 2: Add new/create/edit/update/destroy to campaigns_controller.rb**

After the `close` method, before the end of the class, add:

```ruby
def new
  @campaign = Campaign.new
  render inertia: 'Backend/Campagnes/Form', props: {
    campagne: nil,
    errors: {}
  }
end

def create
  @campaign = Campaign.new(campaign_form_params)
  if @campaign.save
    redirect_to backend_campaign_path(@campaign), notice: 'Campagne créée avec succès.'
  else
    render inertia: 'Backend/Campagnes/Form', props: {
      campagne: nil,
      errors: @campaign.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first.to_s }
    }, status: :unprocessable_entity
  end
end

def edit
  return unless @campaign = find_and_check(:campaign)
  render inertia: 'Backend/Campagnes/Form', props: {
    campagne: {
      'id'           => @campaign.id,
      'name'         => @campaign.name.to_s,
      'harvest_year' => @campaign.harvest_year,
      'description'  => @campaign.description.to_s,
      'closed'       => @campaign.closed
    },
    errors: {}
  }
end

def update
  return unless @campaign = find_and_check(:campaign)
  if @campaign.update(campaign_form_params)
    redirect_to backend_campaign_path(@campaign), notice: 'Campagne mise à jour.'
  else
    render inertia: 'Backend/Campagnes/Form', props: {
      campagne: {
        'id'           => @campaign.id,
        'name'         => @campaign.name.to_s,
        'harvest_year' => @campaign.harvest_year,
        'description'  => @campaign.description.to_s,
        'closed'       => @campaign.closed
      },
      errors: @campaign.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first.to_s }
    }, status: :unprocessable_entity
  end
end

def destroy
  return unless @campaign = find_and_check(:campaign)
  if @campaign.destroyable?
    @campaign.destroy!
    redirect_to backend_campaigns_path, notice: 'Campagne supprimée.'
  else
    redirect_to backend_campaign_path(@campaign),
                alert: 'Impossible de supprimer : des productions sont liées à cette campagne.'
  end
end

private

  def campaign_form_params
    params.require(:campagne).permit(:name, :harvest_year, :description)
  end
```

- [ ] **Step 3: Add `can_destroy` to index and show props**

In the `index` action, update the campagnes map to include `can_destroy`:

```ruby
campagnes: scope.map { |c|
  {
    'id'           => c.id,
    'name'         => c.name.to_s,
    'harvest_year' => c.harvest_year,
    'closed'       => c.closed,
    'can_destroy'  => c.destroyable?
  }
},
```

In the `show` action, add to props:

```ruby
render inertia: 'Backend/Campagnes/Show', props: {
  campagne: { ... },   # existing
  productions: productions,
  can_destroy: @campaign.destroyable?
}
```

- [ ] **Step 4: Verify routes include new/create/edit/update/destroy**

```bash
grep -A3 "resources :campaigns" config/routes.rb
```

If the routes use `concerns: %i[list unroll]` without `only:`, Rails generates all 7 RESTful routes by default — no change needed. If `only:` limits them, add the missing verbs.

- [ ] **Step 5: Commit**

```bash
git add app/controllers/backend/campaigns_controller.rb
git commit -m "feat: wire Campagnes Form new/create/edit/update/destroy with Inertia"
```

---

## Task 3: Parcelles (cultivable_zones) — protect + destroy

**Files:**
- Modify: `app/models/cultivable_zone.rb`
- Modify: `app/controllers/backend/cultivable_zones_controller.rb`

- [ ] **Step 1: Add `protect` block to CultivableZone model**

In `app/models/cultivable_zone.rb`, find the `protect` section or add after the associations. Look for lines like `has_many :interventions` or `has_many :activity_productions`:

```bash
grep -n "protect\|has_many" app/models/cultivable_zone.rb | head -20
```

Add after the existing associations (find the line number from the grep above):

```ruby
protect(on: :destroy) do
  activity_productions.any?
end
```

- [ ] **Step 2: Add destroy + can_destroy to cultivable_zones_controller.rb**

After the `update` action, add:

```ruby
def destroy
  return unless @cultivable_zone = find_and_check
  if @cultivable_zone.destroyable?
    @cultivable_zone.destroy!
    redirect_to backend_cultivable_zones_path, notice: 'Parcelle supprimée.'
  else
    redirect_to backend_cultivable_zone_path(@cultivable_zone),
                alert: 'Impossible de supprimer : des productions sont associées à cette parcelle.'
  end
end
```

- [ ] **Step 3: Add `can_destroy` to index props**

In the `index` action, update the `parcelles` map:

```ruby
parcelles = zones.map do |z|
  zone_obj = CultivableZone.find(z.id)
  z.as_json(only: %i[id name]).merge(
    'area_ha'      => z.area_ha&.to_f,
    'geojson'      => z.geojson,
    'can_destroy'  => zone_obj.destroyable?
  )
end
```

- [ ] **Step 4: Add `can_destroy` to show props**

In the `show` action, add to the `render inertia:` call:

```ruby
render inertia: 'Backend/Parcelles/Show', props: {
  parcelle: { ... },   # existing hash
  productions: productions,
  can_destroy: @cultivable_zone.destroyable?
}
```

- [ ] **Step 5: Commit**

```bash
git add app/models/cultivable_zone.rb \
        app/controllers/backend/cultivable_zones_controller.rb
git commit -m "feat: add destroy + can_destroy to CultivableZone"
```

---

## Task 4: Interventions — protect + destroy

**Files:**
- Modify: `app/models/intervention.rb`
- Modify: `app/controllers/backend/interventions_controller.rb`

- [ ] **Step 1: Check existing protect block on Intervention**

```bash
grep -n "protect(" app/models/intervention.rb
```

If a `protect(on: :destroy)` block already exists, skip adding one. If not, add it near the associations:

```ruby
protect(on: :destroy) do
  sales.any? || purchase_invoices.any?
end
```

Note: if `sales` / `purchase_invoices` associations don't exist on `Intervention`, use:

```bash
grep -n "has_many\|belongs_to" app/models/intervention.rb | head -20
```

Use associations that actually exist (e.g., `intervention_participations.any?` if intervention has no sales directly, or just `false` — interventions can always be deleted by default).

- [ ] **Step 2: Add destroy to interventions_controller.rb**

The interventions controller already has a `destroy` section with `respond_to` (line ~460 per grep). Check if there's already an Inertia-aware destroy:

```bash
grep -n "def destroy" app/controllers/backend/interventions_controller.rb
```

If no `def destroy` exists, add after `update`:

```ruby
def destroy
  return unless @intervention = find_and_check
  if @intervention.destroyable?
    @intervention.destroy!
    redirect_to backend_interventions_path, notice: 'Intervention supprimée.'
  else
    redirect_to backend_intervention_path(@intervention),
                alert: 'Impossible de supprimer : cette intervention est liée à une vente ou facture.'
  end
end
```

- [ ] **Step 3: Add `can_destroy` to show props**

Find the `render inertia: 'Backend/Interventions/Show'` call and add `can_destroy`:

```ruby
render inertia: 'Backend/Interventions/Show', props: {
  intervention: { ... },  # existing
  can_destroy: @intervention.destroyable?
}
```

- [ ] **Step 4: Add `can_destroy` to index props**

Find `render inertia: 'Backend/Interventions/Index'` and add `can_destroy` per record in the collection map:

```ruby
interventions: @interventions.map { |i|
  i.as_json(only: %i[id name state ...]).merge('can_destroy' => i.destroyable?)
}
```

- [ ] **Step 5: Commit**

```bash
git add app/models/intervention.rb \
        app/controllers/backend/interventions_controller.rb
git commit -m "feat: add destroy + can_destroy to Interventions"
```

---

## Task 5: Animals, Workers, Equipements — protect + destroy (batch)

**Files:**
- Modify: `app/models/animal.rb`
- Modify: `app/models/worker.rb`
- Modify: `app/models/equipment.rb`
- Modify: `app/controllers/backend/animals_controller.rb`
- Modify: `app/controllers/backend/workers_controller.rb`
- Modify: `app/controllers/backend/equipments_controller.rb`

For each of these three resources, apply the same pattern. First check associations:

```bash
grep -n "protect(\|has_many" app/models/animal.rb | head -10
grep -n "protect(\|has_many" app/models/worker.rb | head -10
grep -n "protect(\|has_many" app/models/equipment.rb | head -10
```

- [ ] **Step 1: Add protect to animal.rb**

```ruby
protect(on: :destroy) do
  intervention_participations.any?
end
```

(Use `intervention_participations` if `has_many :intervention_participations` exists, otherwise use `interventions.any?` if the association exists.)

- [ ] **Step 2: Add protect to worker.rb**

```ruby
protect(on: :destroy) do
  intervention_participations.any? || worker_time_logs.any?
end
```

- [ ] **Step 3: Add protect to equipment.rb**

```ruby
protect(on: :destroy) do
  intervention_participations.any?
end
```

- [ ] **Step 4: Add destroy to animals_controller.rb**

After the `update` action:

```ruby
def destroy
  return unless @animal = find_and_check
  if @animal.destroyable?
    @animal.destroy!
    redirect_to backend_animals_path, notice: 'Animal supprimé.'
  else
    redirect_to backend_animal_path(@animal),
                alert: 'Impossible de supprimer : cet animal a des participations à des interventions.'
  end
end
```

Add `can_destroy` to show and index props (find the existing `render inertia` calls and add the key):

In `show`:
```ruby
can_destroy: @animal.destroyable?
```

In `index` (per record in the map):
```ruby
'can_destroy' => a.destroyable?
```

- [ ] **Step 5: Add destroy to workers_controller.rb**

```ruby
def destroy
  return unless @worker = find_and_check
  if @worker.destroyable?
    @worker.destroy!
    redirect_to backend_workers_path, notice: 'Travailleur supprimé.'
  else
    redirect_to backend_worker_path(@worker),
                alert: 'Impossible de supprimer : ce travailleur a des interventions ou relevés d\'heures liés.'
  end
end
```

Add `can_destroy` to show and index props.

- [ ] **Step 6: Add destroy to equipments_controller.rb**

```ruby
def destroy
  return unless @equipment = find_and_check
  if @equipment.destroyable?
    @equipment.destroy!
    redirect_to backend_equipments_path, notice: 'Équipement supprimé.'
  else
    redirect_to backend_equipment_path(@equipment),
                alert: 'Impossible de supprimer : cet équipement a des participations à des interventions.'
  end
end
```

Add `can_destroy` to show and index props.

- [ ] **Step 7: Commit**

```bash
git add app/models/animal.rb app/models/worker.rb app/models/equipment.rb \
        app/controllers/backend/animals_controller.rb \
        app/controllers/backend/workers_controller.rb \
        app/controllers/backend/equipments_controller.rb
git commit -m "feat: add destroy + can_destroy to Animals, Workers, Equipements"
```

---

## Task 6: Entities + Sales + PurchaseOrders + Receptions — destroy batch

**Files:**
- Modify: `app/models/sale.rb` (check protect)
- Modify: `app/models/purchase_order.rb` (add protect)
- Modify: `app/models/reception.rb` (add protect)
- Modify: `app/controllers/backend/entities_controller.rb`
- Modify: `app/controllers/backend/sales_controller.rb`
- Modify: `app/controllers/backend/purchase_orders_controller.rb`
- Modify: `app/controllers/backend/receptions_controller.rb`

- [ ] **Step 1: Check/add protect to sale.rb**

```bash
grep -n "protect(" app/models/sale.rb
```

`Sale` already uses `protect` internally (confirmed from grep). The existing `destroyable?` logic prevents destroying invoiced sales. No change needed to the model — just add controller destroy.

- [ ] **Step 2: Check/add protect to purchase_order.rb**

```bash
grep -n "protect(\|has_many" app/models/purchase_order.rb | head -15
```

Add if missing:

```ruby
protect(on: :destroy) do
  receptions.any?
end
```

- [ ] **Step 3: Add protect to reception.rb (incoming_deliveries)**

Check which model backs Receptions:

```bash
grep -n "protect(\|has_many" app/models/incoming_delivery.rb 2>/dev/null | head -10 || \
grep -n "protect(\|has_many" app/models/reception.rb 2>/dev/null | head -10
```

Add if no protect exists:

```ruby
protect(on: :destroy) do
  items.any? { |i| i.purchase_invoice_item_id.present? }
end
```

- [ ] **Step 4: Add destroy to entities_controller.rb**

Entity already has `protect(on: :destroy)` (confirmed). Add:

```ruby
def destroy
  return unless @entity = find_and_check
  if @entity.destroyable?
    @entity.destroy!
    redirect_to backend_entities_path, notice: 'Entité supprimée.'
  else
    redirect_to backend_entity_path(@entity),
                alert: 'Impossible de supprimer : cette entité a des ventes, achats ou travailleurs liés.'
  end
end
```

Add `can_destroy: @entity.destroyable?` to show and index props.

- [ ] **Step 5: Add destroy to sales_controller.rb**

The sales controller has `manage_restfully` but the existing Inertia-aware actions override it. After the `update` action:

```ruby
def destroy
  return unless @sale = find_and_check
  if @sale.destroyable?
    @sale.destroy!
    redirect_to backend_sales_path, notice: 'Vente supprimée.'
  else
    redirect_to backend_sale_path(@sale),
                alert: 'Impossible de supprimer : cette vente est confirmée ou a des lignes facturées.'
  end
end
```

Add `can_destroy` to show and index props (find existing render inertia calls).

- [ ] **Step 6: Add destroy to purchase_orders_controller.rb**

```ruby
def destroy
  return unless @purchase_order = find_and_check
  if @purchase_order.destroyable?
    @purchase_order.destroy!
    redirect_to backend_purchase_orders_path, notice: 'Commande supprimée.'
  else
    redirect_to backend_purchase_order_path(@purchase_order),
                alert: 'Impossible de supprimer : cette commande a des réceptions liées.'
  end
end
```

Add `can_destroy` to show and index props.

- [ ] **Step 7: Add destroy to receptions_controller.rb**

```ruby
def destroy
  return unless @reception = find_and_check
  if @reception.destroyable?
    @reception.destroy!
    redirect_to backend_receptions_path, notice: 'Réception supprimée.'
  else
    redirect_to backend_reception_path(@reception),
                alert: 'Impossible de supprimer : cette réception est liée à une facture.'
  end
end
```

Add `can_destroy` to show and index props.

- [ ] **Step 8: Commit**

```bash
git add app/models/sale.rb app/models/purchase_order.rb \
        app/controllers/backend/entities_controller.rb \
        app/controllers/backend/sales_controller.rb \
        app/controllers/backend/purchase_orders_controller.rb \
        app/controllers/backend/receptions_controller.rb
git commit -m "feat: add destroy + can_destroy to Entités, Ventes, Achats, Réceptions"
```

---

## Task 7: ActivityProductions + JournalEntries + Activities + Issues + ProjectBudgets + Products — destroy batch

**Files:**
- Modify: `app/models/journal_entry.rb` (add protect)
- Modify: `app/models/project_budget.rb` (add protect)
- Modify: `app/models/product.rb` (add protect)
- Modify: `app/controllers/backend/activity_productions_controller.rb`
- Modify: `app/controllers/backend/journal_entries_controller.rb`
- Modify: `app/controllers/backend/activities_controller.rb`
- Modify: `app/controllers/backend/issues_controller.rb`
- Modify: `app/controllers/backend/project_budgets_controller.rb`
- Modify: `app/controllers/backend/products_controller.rb`

- [ ] **Step 1: Check protect on journal_entry.rb**

```bash
grep -n "protect(" app/models/journal_entry.rb
```

If no protect, add:

```ruby
protect(on: :destroy) do
  confirmed?
end
```

- [ ] **Step 2: Check protect on project_budget.rb**

```bash
grep -n "protect(\|has_many" app/models/project_budget.rb | head -10
```

Add if missing:

```ruby
protect(on: :destroy) do
  project_budget_items.any?
end
```

- [ ] **Step 3: Add protect to product.rb (catalogue)**

```bash
grep -n "protect(\|has_many" app/models/product.rb | head -10
```

Add if missing:

```ruby
protect(on: :destroy) do
  catalog_items.any? || sale_items.any? || purchase_items.any?
end
```

- [ ] **Step 4: Add destroy to activity_productions_controller.rb**

ActivityProduction already has `protect(on: :destroy)`. Add:

```ruby
def destroy
  return unless @activity_production = find_and_check
  if @activity_production.destroyable?
    @activity_production.destroy!
    redirect_to backend_activity_productions_path, notice: 'Production supprimée.'
  else
    redirect_to backend_activity_production_path(@activity_production),
                alert: 'Impossible de supprimer : cette production a des interventions liées.'
  end
end
```

Add `can_destroy` to show and index props.

- [ ] **Step 5: Add destroy to journal_entries_controller.rb**

```ruby
def destroy
  return unless @journal_entry = find_and_check
  if @journal_entry.destroyable?
    @journal_entry.destroy!
    redirect_to backend_journal_entries_path, notice: 'Écriture supprimée.'
  else
    redirect_to backend_journal_entry_path(@journal_entry),
                alert: 'Impossible de supprimer : cette écriture est confirmée.'
  end
end
```

Add `can_destroy` to show and index props.

- [ ] **Step 6: Add destroy to activities_controller.rb**

```bash
grep -n "protect(" app/models/activity.rb
```

Activity already has `protect(on: :destroy)` with `activity_productions.any?`. Add to controller:

```ruby
def destroy
  return unless @activity = find_and_check
  if @activity.destroyable?
    @activity.destroy!
    redirect_to backend_activities_path, notice: 'Activité supprimée.'
  else
    redirect_to backend_activity_path(@activity),
                alert: 'Impossible de supprimer : cette activité a des productions liées.'
  end
end
```

Add `can_destroy` to show and index props.

- [ ] **Step 7: Add destroy to issues_controller.rb**

```ruby
def destroy
  return unless @issue = find_and_check
  if @issue.destroyable?
    @issue.destroy!
    redirect_to backend_alerts_path, notice: 'Alerte supprimée.'
  else
    redirect_to backend_issue_path(@issue),
                alert: 'Impossible de supprimer : cette alerte a des interventions liées.'
  end
end
```

Add `can_destroy` to show and index props.

- [ ] **Step 8: Add destroy to project_budgets_controller.rb**

```ruby
def destroy
  return unless @project_budget = find_and_check
  if @project_budget.destroyable?
    @project_budget.destroy!
    redirect_to backend_project_budgets_path, notice: 'Budget supprimé.'
  else
    redirect_to backend_project_budget_path(@project_budget),
                alert: 'Impossible de supprimer : ce budget a des lignes saisies.'
  end
end
```

Add `can_destroy` to show and index props.

- [ ] **Step 9: Add destroy to products_controller.rb**

```ruby
def destroy
  return unless @product = find_and_check
  if @product.destroyable?
    @product.destroy!
    redirect_to backend_products_path, notice: 'Produit supprimé.'
  else
    redirect_to backend_product_path(@product),
                alert: 'Impossible de supprimer : ce produit est utilisé dans des ventes, achats ou catalogues.'
  end
end
```

Add `can_destroy` to show and index props.

- [ ] **Step 10: Rubocop**

```bash
bundle exec rubocop -a app/controllers/backend/ app/models/
```

Fix any style issues automatically.

- [ ] **Step 11: Commit**

```bash
git add app/models/journal_entry.rb app/models/project_budget.rb app/models/product.rb \
        app/controllers/backend/activity_productions_controller.rb \
        app/controllers/backend/journal_entries_controller.rb \
        app/controllers/backend/activities_controller.rb \
        app/controllers/backend/issues_controller.rb \
        app/controllers/backend/project_budgets_controller.rb \
        app/controllers/backend/products_controller.rb
git commit -m "feat: add destroy + can_destroy to Productions, Comptabilité, Activités, Alertes, Budgets, Catalogue"
```

---

## Task 8: React — wire FlashBanner + canDestroy in Parcelles, Interventions, Campagnes

**Files:**
- Modify: `app/frontend/pages/Backend/Parcelles/Form.tsx`
- Modify: `app/frontend/pages/Backend/Parcelles/Show.tsx`
- Modify: `app/frontend/pages/Backend/Parcelles/Index.tsx`
- Modify: `app/frontend/pages/Backend/Interventions/Form.tsx`
- Modify: `app/frontend/pages/Backend/Interventions/Show.tsx`
- Modify: `app/frontend/pages/Backend/Campagnes/Form.tsx`
- Modify: `app/frontend/pages/Backend/Campagnes/Show.tsx`

- [ ] **Step 1: Update Parcelles/Form.tsx — add FlashBanner**

Add `FlashBanner` to imports:

```tsx
import { BackLink, IconBox, SectionCard, SectionTitle, FormField, PrimaryButton, FlashBanner } from '../../../components/ui'
```

Change the `errors` prop type to `Record<string, string | string[]>` and add `FlashBanner` at the top of the form:

```tsx
interface ParcellesFormProps {
  parcelle: ParcelleFormData | null
  errors: Record<string, string | string[]>
}
```

Inside the `<SectionCard>`, before `<form>`:

```tsx
<SectionCard>
  <SectionTitle icon={Map}>Informations de la parcelle</SectionTitle>
  <FlashBanner errors={errors} />
  <form onSubmit={handleSubmit} noValidate>
    ...
  </form>
</SectionCard>
```

Update each `FormField` to pass the first error string:

```tsx
error={Array.isArray(errors.name) ? errors.name[0] : errors.name}
```

- [ ] **Step 2: Update Parcelles/Show.tsx — add ConfirmDeleteButton**

The Show page currently has a "Modifier" button but no delete. Add imports and delete button:

```tsx
import { BackLink, SectionCard, SectionTitle, DetailRow, StateBadge, CodeBadge, PrimaryButton, DataTable, ConfirmDeleteButton } from '../../../components/ui'
import { router } from '@inertiajs/react'
```

Update `ParcelleShowProps` to include `canDestroy`:

```tsx
interface ParcelleShowProps {
  parcelle: { ... }  // existing fields
  productions: ProductionRow[]
  canDestroy: boolean
}
```

In the component signature:

```tsx
function ParcelleShow({ parcelle, productions, canDestroy }: ParcelleShowProps)
```

Add delete button next to "Modifier":

```tsx
<div className="flex justify-between items-start mb-6">
  <div>
    <h1 ...>{parcelle.name}</h1>
    {parcelle.work_number && <CodeBadge value={parcelle.work_number} />}
  </div>
  <div className="flex gap-2">
    <PrimaryButton href={`/backend/cultivable-zones/${parcelle.id}/edit`} variant="secondary">Modifier</PrimaryButton>
    <ConfirmDeleteButton
      onDelete={() => router.delete(`/backend/cultivable-zones/${parcelle.id}`)}
      canDestroy={canDestroy}
      resourceName="cette parcelle"
    />
  </div>
</div>
```

- [ ] **Step 3: Update Parcelles/Index.tsx — add canDestroy per row**

Read the current Index file:

```bash
cat app/frontend/pages/Backend/Parcelles/Index.tsx
```

Add `can_destroy` to the `Parcelle` interface and add a delete button in the row actions. For each row in the table, add:

```tsx
<ConfirmDeleteButton
  onDelete={() => router.delete(`/backend/cultivable-zones/${p.id}`)}
  canDestroy={p.can_destroy ?? true}
  resourceName={p.name}
  size="sm"
/>
```

- [ ] **Step 4: Apply same pattern to Interventions/Form.tsx**

Add `FlashBanner` import and usage (same pattern as Parcelles Form above).

Change errors type to `Record<string, string | string[]>`.

Add `<FlashBanner errors={errors} />` inside the SectionCard before the form.

- [ ] **Step 5: Apply same pattern to Interventions/Show.tsx**

Add `ConfirmDeleteButton` import. Add `canDestroy: boolean` to props interface. Add delete button next to edit button:

```tsx
<ConfirmDeleteButton
  onDelete={() => router.delete(`/backend/interventions/${intervention.id}`)}
  canDestroy={canDestroy}
  resourceName="cette intervention"
/>
```

- [ ] **Step 6: Update Campagnes/Form.tsx — add FlashBanner**

Same as Parcelles Form pattern. Add FlashBanner import, update errors type, add `<FlashBanner errors={errors} />` before the form inside SectionCard.

- [ ] **Step 7: Update Campagnes/Show.tsx — add ConfirmDeleteButton**

Read the current Show:

```bash
cat app/frontend/pages/Backend/Campagnes/Show.tsx
```

Add `canDestroy: boolean` to props. Import `ConfirmDeleteButton` and `router`. Add delete button in the header actions area.

- [ ] **Step 8: Run TypeScript check**

```bash
yarn tsc --noEmit
```

Fix any type errors.

- [ ] **Step 9: Commit**

```bash
git add app/frontend/pages/Backend/Parcelles/ \
        app/frontend/pages/Backend/Interventions/Form.tsx \
        app/frontend/pages/Backend/Interventions/Show.tsx \
        app/frontend/pages/Backend/Campagnes/Form.tsx \
        app/frontend/pages/Backend/Campagnes/Show.tsx
git commit -m "feat: wire FlashBanner + ConfirmDeleteButton in Parcelles, Interventions, Campagnes"
```

---

## Task 9: React — wire FlashBanner + canDestroy in Productions, Comptabilité, Ventes, Achats

**Files:**
- Modify: `app/frontend/pages/Backend/Productions/Form.tsx`
- Modify: `app/frontend/pages/Backend/Productions/Show.tsx`
- Modify: `app/frontend/pages/Backend/Comptabilite/Form.tsx`
- Modify: `app/frontend/pages/Backend/Comptabilite/Show.tsx`
- Modify: `app/frontend/pages/Backend/Ventes/Form.tsx`
- Modify: `app/frontend/pages/Backend/Ventes/Show.tsx`
- Modify: `app/frontend/pages/Backend/Achats/CommandesForm.tsx`
- Modify: `app/frontend/pages/Backend/Achats/CommandesShow.tsx`
- Modify: `app/frontend/pages/Backend/Achats/FacturesShow.tsx`
- Modify: `app/frontend/pages/Backend/Receptions/ReceptionsForm.tsx`
- Modify: `app/frontend/pages/Backend/Receptions/ReceptionsShow.tsx`

For each Form file, apply this pattern:

- [ ] **Step 1: Read each file first**

```bash
cat app/frontend/pages/Backend/Productions/Form.tsx
cat app/frontend/pages/Backend/Ventes/Form.tsx
cat app/frontend/pages/Backend/Achats/CommandesForm.tsx
cat app/frontend/pages/Backend/Receptions/ReceptionsForm.tsx
```

- [ ] **Step 2: Update each Form.tsx**

For each Form component:
1. Add `FlashBanner` to the UI imports line
2. Change `errors` type from `Record<string, string>` to `Record<string, string | string[]>`
3. Add `<FlashBanner errors={errors} />` inside the main SectionCard just before the `<form>` tag
4. Update each `FormField` error prop: `error={Array.isArray(errors.fieldName) ? errors.fieldName[0] : errors.fieldName}`

- [ ] **Step 3: Update each Show.tsx**

For each Show component:
1. Add `ConfirmDeleteButton` to UI imports
2. Add `import { router } from '@inertiajs/react'`
3. Add `canDestroy: boolean` to the props interface
4. Update component signature to destructure `canDestroy`
5. Add `<ConfirmDeleteButton>` next to the "Modifier" button

Resource-specific delete routes:
- Productions Show: `router.delete(\`/backend/activity_productions/${production.id}\`)`
- Comptabilité Show: `router.delete(\`/backend/journal_entries/${entry.id}\`)`
- Ventes Show: `router.delete(\`/backend/sales/${vente.id}\`)`
- CommandesShow: `router.delete(\`/backend/purchase_orders/${commande.id}\`)`
- FacturesShow: `router.delete(\`/backend/purchase_invoices/${facture.id}\`)`
- ReceptionsShow: `router.delete(\`/backend/receptions/${reception.id}\`)`

- [ ] **Step 4: TypeScript check**

```bash
yarn tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add app/frontend/pages/Backend/Productions/ \
        app/frontend/pages/Backend/Comptabilite/ \
        app/frontend/pages/Backend/Ventes/ \
        app/frontend/pages/Backend/Achats/ \
        app/frontend/pages/Backend/Receptions/
git commit -m "feat: wire FlashBanner + ConfirmDeleteButton in Productions, Comptabilité, Ventes, Achats, Réceptions"
```

---

## Task 10: React — wire FlashBanner + canDestroy in Budgets, Entités, Équipements, Travailleurs, Animaux, Catalogue, Alertes

**Files:**
- Modify: `app/frontend/pages/Backend/Budgets/Form.tsx` + `Show.tsx`
- Modify: `app/frontend/pages/Backend/Entites/Form.tsx` + `Show.tsx` + `AddressForm.tsx`
- Modify: `app/frontend/pages/Backend/Equipements/Form.tsx` + `Show.tsx`
- Modify: `app/frontend/pages/Backend/Travailleurs/Form.tsx` + `Show.tsx`
- Modify: `app/frontend/pages/Backend/Animaux/Form.tsx` + `Show.tsx`
- Modify: `app/frontend/pages/Backend/Catalogue/Form.tsx` + `Show.tsx`
- Modify: `app/frontend/pages/Backend/Alertes/IssueForm.tsx` + `IssueShow.tsx`
- Modify: `app/frontend/pages/Backend/Activites/Form.tsx` + `Show.tsx`

- [ ] **Step 1: Read each Form.tsx**

```bash
for f in Budgets Entites Equipements Travailleurs Animaux Catalogue Activites; do
  echo "=== $f ==="; cat app/frontend/pages/Backend/$f/Form.tsx | head -30
done
cat app/frontend/pages/Backend/Alertes/IssueForm.tsx | head -30
```

- [ ] **Step 2: Update all Form.tsx files**

Apply to each Form:
1. Add `FlashBanner` to UI imports
2. Change errors type: `Record<string, string | string[]>`
3. Add `<FlashBanner errors={errors} />` before `<form>` inside the SectionCard
4. Update FormField error props to handle arrays

- [ ] **Step 3: Read each Show.tsx**

```bash
for f in Budgets Entites Equipements Travailleurs Animaux Catalogue Activites; do
  echo "=== $f ==="; cat app/frontend/pages/Backend/$f/Show.tsx | head -30
done
cat app/frontend/pages/Backend/Alertes/IssueShow.tsx | head -30
```

- [ ] **Step 4: Update all Show.tsx files**

Apply to each Show:
1. Add `ConfirmDeleteButton` to UI imports
2. Add `import { router } from '@inertiajs/react'`
3. Add `canDestroy: boolean` to props interface
4. Add delete button in actions

Resource-specific routes:
- Budgets Show: `router.delete(\`/backend/project_budgets/${budget.id}\`)`
- Entites Show: `router.delete(\`/backend/entities/${entite.id}\`)`
- Equipements Show: `router.delete(\`/backend/equipments/${equipement.id}\`)`
- Travailleurs Show: `router.delete(\`/backend/workers/${travailleur.id}\`)`
- Animaux Show: `router.delete(\`/backend/animals/${animal.id}\`)`
- Catalogue Show: `router.delete(\`/backend/products/${produit.id}\`)`
- Activites Show: `router.delete(\`/backend/activities/${activite.id}\`)`
- IssueShow: `router.delete(\`/backend/issues/${issue.id}\`)`

- [ ] **Step 5: TypeScript check**

```bash
yarn tsc --noEmit
```

Fix any errors.

- [ ] **Step 6: Commit**

```bash
git add app/frontend/pages/Backend/Budgets/ \
        app/frontend/pages/Backend/Entites/ \
        app/frontend/pages/Backend/Equipements/ \
        app/frontend/pages/Backend/Travailleurs/ \
        app/frontend/pages/Backend/Animaux/ \
        app/frontend/pages/Backend/Catalogue/ \
        app/frontend/pages/Backend/Alertes/ \
        app/frontend/pages/Backend/Activites/
git commit -m "feat: wire FlashBanner + ConfirmDeleteButton in Budgets, Entités, Équipements, Travailleurs, Animaux, Catalogue, Alertes, Activités"
```

---

## Task 11: QA — TypeScript + Vitest full pass

**Files:** No changes — verification only.

- [ ] **Step 1: Full TypeScript check**

```bash
yarn tsc --noEmit 2>&1 | head -50
```

Expected: `0 errors`. Fix any remaining type issues before proceeding.

- [ ] **Step 2: Run all frontend tests**

```bash
yarn vitest run --reporter=verbose 2>&1 | tail -30
```

Expected: all tests PASS. If failures, fix them.

- [ ] **Step 3: Run Rubocop**

```bash
bundle exec rubocop -a app/controllers/backend/ app/models/ 2>&1 | tail -20
```

Expected: no offenses (auto-fixed where possible).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: QA pass — fix tsc/vitest/rubocop after CRUD wiring"
```

---

## Summary of changes

| Module | Controller destroy | can_destroy prop | Form FlashBanner | Show ConfirmDelete |
|---|---|---|---|---|
| Campagnes | ✅ Task 2 | ✅ Task 2 | ✅ Task 8 | ✅ Task 8 |
| Parcelles | ✅ Task 3 | ✅ Task 3 | ✅ Task 8 | ✅ Task 8 |
| Interventions | ✅ Task 4 | ✅ Task 4 | ✅ Task 8 | ✅ Task 8 |
| Animals | ✅ Task 5 | ✅ Task 5 | ✅ Task 10 | ✅ Task 10 |
| Workers | ✅ Task 5 | ✅ Task 5 | ✅ Task 10 | ✅ Task 10 |
| Equipements | ✅ Task 5 | ✅ Task 5 | ✅ Task 10 | ✅ Task 10 |
| Entités | ✅ Task 6 | ✅ Task 6 | ✅ Task 10 | ✅ Task 10 |
| Ventes | ✅ Task 6 | ✅ Task 6 | ✅ Task 9 | ✅ Task 9 |
| PurchaseOrders | ✅ Task 6 | ✅ Task 6 | ✅ Task 9 | ✅ Task 9 |
| Réceptions | ✅ Task 6 | ✅ Task 6 | ✅ Task 9 | ✅ Task 9 |
| Productions | ✅ Task 7 | ✅ Task 7 | ✅ Task 9 | ✅ Task 9 |
| Comptabilité | ✅ Task 7 | ✅ Task 7 | ✅ Task 9 | ✅ Task 9 |
| Activités | ✅ Task 7 | ✅ Task 7 | ✅ Task 10 | ✅ Task 10 |
| Alertes/Issues | ✅ Task 7 | ✅ Task 7 | ✅ Task 10 | ✅ Task 10 |
| Budgets | ✅ Task 7 | ✅ Task 7 | ✅ Task 10 | ✅ Task 10 |
| Catalogue | ✅ Task 7 | ✅ Task 7 | ✅ Task 10 | ✅ Task 10 |
| PurchaseInvoices | already had it | ✅ already had it | ✅ Task 9 | ✅ Task 9 |
