# Phase 2 — Animaux + Travailleurs Forms : Design Spec

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement the plan derived from this spec.

**Goal:** Complete the React/Inertia migration for Animaux and Travailleurs by adding the missing Form pages (new/edit/create/update) to both modules.

**Architecture:** Same pattern as all previously migrated Form pages (Équipements, Activités, etc.). Two Form.tsx + two Form.test.tsx created. Two controllers extended with explicit Inertia new/edit/create/update actions. Two type files extended with FormProps. No new architecture decisions.

**Tech Stack:** React 18, TypeScript strict, `@inertiajs/react`, Vitest + React Testing Library, Ruby on Rails 6 (Ruby 2.6).

---

## File Structure

```
app/frontend/types/animal.ts                          ← add AnimalFormProps
app/frontend/types/travailleur.ts                     ← add TravailleurFormProps
app/frontend/pages/Backend/Animaux/Form.tsx           ← new
app/frontend/pages/Backend/Animaux/Form.test.tsx      ← new (6 tests)
app/frontend/pages/Backend/Travailleurs/Form.tsx      ← new
app/frontend/pages/Backend/Travailleurs/Form.test.tsx ← new (6 tests)
app/controllers/backend/animals_controller.rb         ← add new/edit/create/update
app/controllers/backend/workers_controller.rb         ← add new/edit/create/update
```

---

## TypeScript Types

### `types/animal.ts` — add at end of file

```typescript
export interface AnimalFormProps {
  animal: (AnimalDetail & { id?: number }) | null
  errors: Record<string, string[]>
}
```

### `types/travailleur.ts` — add at end of file

```typescript
export interface TravailleurFormProps {
  travailleur: (TravailleurDetail & { id?: number }) | null
  errors: Record<string, string[]>
}
```

---

## Animaux Form — `pages/Backend/Animaux/Form.tsx`

**Heading:** "Nouvel animal" (create) or `"Modifier l'animal ${animal.name}"` (edit).

**Fields:**
| Label | Field | Type | Required |
|-------|-------|------|----------|
| Nom | `name` | text input | yes |
| N° travail | `work_number` | text input | no |
| Race / Variété | `variety` | text input | no |
| N° identification | `identification_number` | text input | no |
| Date de naissance | `born_at` | date input | no |
| Date de décès | `dead_at` | date input | no |
| Description | `description` | textarea | no |

**Submit:**
```typescript
// create
router.post('/backend/animals', {
  'animal[name]': name,
  'animal[work_number]': workNumber,
  'animal[variety]': variety,
  'animal[identification_number]': identificationNumber,
  'animal[born_at]': bornAt,
  'animal[dead_at]': deadAt,
  'animal[description]': description,
})
// edit
router.patch(`/backend/animals/${animal.id}`, { ... })
```

**Per-field errors:** `FieldError` helper (same pattern as other forms).

**Form:** `aria-label="Formulaire animal"` for test `getByRole('form')`.

**Layout:** `Form.layout = (page: ReactNode) => <AppShell>{page}</AppShell>`

**Cancel link:** `<a href="/backend/animals">` → Annuler button.

**Tests (6):**
1. "Nouvel animal" heading on create (animal = null)
2. "Modifier l'animal {name}" heading on edit (animal with id)
3. Name input rendered and required
4. born_at date input rendered
5. `router.post` called on new form submit
6. `router.patch` called on edit form submit

---

## Travailleurs Form — `pages/Backend/Travailleurs/Form.tsx`

**Heading:** "Nouveau travailleur" (create) or `"Modifier le travailleur ${travailleur.name}"` (edit).

**Fields:**
| Label | Field | Type | Required |
|-------|-------|------|----------|
| Nom | `name` | text input | yes |
| N° travail | `work_number` | text input | no |
| N° identification | `identification_number` | text input | no |
| Date de naissance | `born_at` | date input | no |
| Date de départ | `dead_at` | date input | no |
| Description | `description` | textarea | no |

**Submit:**
```typescript
// create
router.post('/backend/workers', {
  'worker[name]': name,
  'worker[work_number]': workNumber,
  'worker[identification_number]': identificationNumber,
  'worker[born_at]': bornAt,
  'worker[dead_at]': deadAt,
  'worker[description]': description,
})
// edit
router.patch(`/backend/workers/${travailleur.id}`, { ... })
```

**Form:** `aria-label="Formulaire travailleur"` for test `getByRole('form')`.

**Layout:** `Form.layout = (page: ReactNode) => <AppShell>{page}</AppShell>`

**Cancel link:** `<a href="/backend/workers">` → Annuler button.

**Tests (6):**
1. "Nouveau travailleur" heading on create (travailleur = null)
2. "Modifier le travailleur {name}" heading on edit (travailleur with id)
3. Name input rendered and required
4. born_at date input rendered
5. `router.post` called on new form submit
6. `router.patch` called on edit form submit

---

## Rails Controller — `animals_controller.rb`

The controller extends `Backend::MattersController` which uses `manage_restfully`. Add explicit overrides:

```ruby
def new
  render inertia: 'Backend/Animaux/Form', props: {
    animal: nil,
    errors: {}
  }
end

def edit
  return unless @animal = find_and_check(:animal)
  render inertia: 'Backend/Animaux/Form', props: {
    animal: animal_json(@animal),
    errors: {}
  }
end

def create
  @animal = Animal.new(animal_params)
  if @animal.save
    redirect_to backend_animal_path(@animal)
  else
    render inertia: 'Backend/Animaux/Form', props: {
      animal: nil,
      errors: @animal.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v }
    }, status: :unprocessable_entity
  end
end

def update
  return unless @animal = find_and_check(:animal)
  if @animal.update(animal_params)
    redirect_to backend_animal_path(@animal)
  else
    render inertia: 'Backend/Animaux/Form', props: {
      animal: animal_json(@animal),
      errors: @animal.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v }
    }, status: :unprocessable_entity
  end
end

private

def animal_json(animal)
  {
    id: animal.id,
    name: animal.name,
    work_number: animal.work_number,
    variety: animal.variety,
    identification_number: animal.identification_number,
    born_at: animal.born_at&.to_date&.iso8601,
    dead_at: animal.dead_at&.to_date&.iso8601,
    description: animal.description
  }
end

def animal_params
  params.require(:animal).permit(
    :name, :work_number, :variety, :identification_number,
    :born_at, :dead_at, :description
  )
end
```

**Ruby 2.6 constraints:** No `filter_map`, `then`, `yield_self`. Use `.each_with_object` as shown.

---

## Rails Controller — `workers_controller.rb`

The controller extends `Backend::ProductsController`. Same pattern:

```ruby
def new
  render inertia: 'Backend/Travailleurs/Form', props: {
    travailleur: nil,
    errors: {}
  }
end

def edit
  return unless @worker = find_and_check(:worker)
  render inertia: 'Backend/Travailleurs/Form', props: {
    travailleur: worker_json(@worker),
    errors: {}
  }
end

def create
  @worker = Worker.new(worker_params)
  if @worker.save
    redirect_to backend_worker_path(@worker)
  else
    render inertia: 'Backend/Travailleurs/Form', props: {
      travailleur: nil,
      errors: @worker.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v }
    }, status: :unprocessable_entity
  end
end

def update
  return unless @worker = find_and_check(:worker)
  if @worker.update(worker_params)
    redirect_to backend_worker_path(@worker)
  else
    render inertia: 'Backend/Travailleurs/Form', props: {
      travailleur: worker_json(@worker),
      errors: @worker.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v }
    }, status: :unprocessable_entity
  end
end

private

def worker_json(worker)
  {
    id: worker.id,
    name: worker.name,
    work_number: worker.work_number,
    identification_number: worker.identification_number,
    born_at: worker.born_at&.to_date&.iso8601,
    dead_at: worker.dead_at&.to_date&.iso8601,
    description: worker.description
  }
end

def worker_params
  params.require(:worker).permit(
    :name, :work_number, :identification_number,
    :born_at, :dead_at, :description
  )
end
```

---

## Testing Strategy

- Vitest + React Testing Library
- Mock `@inertiajs/react` router in each file
- 6 tests per Form page = 12 total new tests
- TDD: write failing tests first, then implement

## Scope Exclusions (YAGNI)

- No photo/image upload (animals or workers)
- No variant/nature selector (handled by manage_restfully defaults)
- No nested attributes (no contacts, locations, etc.)
- `number` field is auto-generated by Rails — not shown in form
