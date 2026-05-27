# Phase 2 — Animaux + Travailleurs Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Form pages (new/edit/create/update) for the Animaux and Travailleurs modules to complete their React/Inertia migration.

**Architecture:** Two self-contained tasks, one per module. Each task adds `FormProps` to the type file, extends the Rails controller with `new/edit/create/update` actions and private helpers, creates `Form.tsx` following the Equipements pattern (Tailwind className + CSS vars, `submitting` state, nested data object), and creates `Form.test.tsx` with 6 tests. No new architecture decisions.

**Tech Stack:** React 18, TypeScript strict, `@inertiajs/react`, Vitest + React Testing Library, Ruby on Rails 6 (Ruby 2.6).

---

## File Structure

```
app/frontend/types/animal.ts                          ← add AnimalFormProps
app/frontend/pages/Backend/Animaux/Form.tsx           ← new
app/frontend/pages/Backend/Animaux/Form.test.tsx      ← new (6 tests)
app/controllers/backend/animals_controller.rb         ← extend layout + add new/edit/create/update

app/frontend/types/travailleur.ts                     ← add TravailleurFormProps
app/frontend/pages/Backend/Travailleurs/Form.tsx      ← new
app/frontend/pages/Backend/Travailleurs/Form.test.tsx ← new (6 tests)
app/controllers/backend/workers_controller.rb         ← extend layout + add new/edit/create/update
```

---

## Task 1: Animaux Form

**Files:**
- Modify: `app/frontend/types/animal.ts`
- Create: `app/frontend/pages/Backend/Animaux/Form.tsx`
- Create: `app/frontend/pages/Backend/Animaux/Form.test.tsx`
- Modify: `app/controllers/backend/animals_controller.rb`

---

- [ ] **Step 1: Add AnimalFormProps to type file**

Open `app/frontend/types/animal.ts`. Append at the **end of the file**:

```typescript
export interface AnimalFormProps {
  animal: (AnimalDetail & { id?: number }) | null
  errors: Record<string, string[]>
}
```

---

- [ ] **Step 2: Write the failing tests**

Create `app/frontend/pages/Backend/Animaux/Form.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Form from './Form'
import type { AnimalFormProps } from '../../../types/animal'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), patch: vi.fn() },
}))

import { router } from '@inertiajs/react'

const mockAnimal = {
  id: 1,
  name: 'Bœuf Alpha',
  number: 'AN-001',
  work_number: 'W-001',
  identification_number: 'ID-001',
  variety: 'Ndama',
  born_at: '2020-01-15',
  dead_at: null,
  description: 'Un bœuf robuste',
  interventions: [],
}

function renderForm(props: AnimalFormProps) {
  return render(<Form {...props} />)
}

describe('Animaux Form', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "Nouvel animal" heading on create', () => {
    renderForm({ animal: null, errors: {} })
    expect(screen.getByRole('heading', { name: /Nouvel animal/i })).toBeInTheDocument()
  })

  it('shows "Modifier l\'animal {name}" heading on edit', () => {
    renderForm({ animal: mockAnimal, errors: {} })
    expect(screen.getByRole('heading', { name: /Modifier l'animal Bœuf Alpha/i })).toBeInTheDocument()
  })

  it('renders name input as required', () => {
    renderForm({ animal: null, errors: {} })
    const input = screen.getByLabelText(/^Nom/i)
    expect(input).toBeInTheDocument()
    expect(input).toBeRequired()
  })

  it('renders born_at date input', () => {
    renderForm({ animal: null, errors: {} })
    expect(screen.getByLabelText(/Date de naissance/i)).toBeInTheDocument()
  })

  it('calls router.post on new form submit', async () => {
    renderForm({ animal: null, errors: {} })
    fireEvent.change(screen.getByLabelText(/^Nom/i), { target: { value: 'Vache Bêta' } })
    fireEvent.submit(screen.getByRole('form'))
    expect(router.post).toHaveBeenCalledWith(
      '/backend/animals',
      expect.objectContaining({ 'animal[name]': 'Vache Bêta' }),
      expect.any(Object)
    )
  })

  it('calls router.patch on edit form submit', async () => {
    renderForm({ animal: mockAnimal, errors: {} })
    fireEvent.submit(screen.getByRole('form'))
    expect(router.patch).toHaveBeenCalledWith(
      '/backend/animals/1',
      expect.objectContaining({ 'animal[name]': 'Bœuf Alpha' }),
      expect.any(Object)
    )
  })
})
```

---

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd ekylibre-main
yarn vitest run app/frontend/pages/Backend/Animaux/Form.test.tsx --reporter=verbose
```

Expected: **FAIL** — `Cannot find module './Form'`

---

- [ ] **Step 4: Create Form.tsx**

Create `app/frontend/pages/Backend/Animaux/Form.tsx`:

```tsx
import { type ReactNode, useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Save, PawPrint } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { AnimalFormProps } from '../../../types/animal'

function FieldError({ errors, field }: { errors: Record<string, string[]>; field: string }) {
  const msgs = errors[field]
  if (!msgs || msgs.length === 0) return null
  return (
    <p id={`animal-${field}-error`} className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
      {msgs[0]}
    </p>
  )
}

export default function Form({ animal, errors }: AnimalFormProps) {
  const isEdit = animal !== null && animal.id !== undefined

  const [name, setName] = useState(animal?.name ?? '')
  const [workNumber, setWorkNumber] = useState(animal?.work_number ?? '')
  const [variety, setVariety] = useState(animal?.variety ?? '')
  const [identificationNumber, setIdentificationNumber] = useState(animal?.identification_number ?? '')
  const [bornAt, setBornAt] = useState(animal?.born_at ?? '')
  const [deadAt, setDeadAt] = useState(animal?.dead_at ?? '')
  const [description, setDescription] = useState(animal?.description ?? '')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const data = {
      'animal[name]': name,
      'animal[work_number]': workNumber,
      'animal[variety]': variety,
      'animal[identification_number]': identificationNumber,
      'animal[born_at]': bornAt,
      'animal[dead_at]': deadAt,
      'animal[description]': description,
    }
    const opts = { onFinish: () => setSubmitting(false) }
    if (isEdit) {
      router.patch(`/backend/animals/${animal!.id}`, data, opts)
    } else {
      router.post('/backend/animals', data, opts)
    }
  }

  const heading = isEdit ? `Modifier l'animal ${animal!.name}` : 'Nouvel animal'

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <a href="/backend/animals" className="text-muted hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </a>
        <PawPrint size={22} style={{ color: 'var(--color-primary)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{heading}</h1>
      </div>

      <form
        aria-label="Formulaire animal"
        onSubmit={handleSubmit}
        className="rounded-lg border p-6 flex flex-col gap-5"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        {/* Nom */}
        <div className="flex flex-col gap-1">
          <label htmlFor="animal-name" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            Nom <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <input
            id="animal-name"
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'animal-name-error' : undefined}
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: errors.name ? 'var(--color-danger)' : 'var(--color-border)', background: 'var(--color-bg)' }}
          />
          <FieldError errors={errors} field="name" />
        </div>

        {/* N° travail */}
        <div className="flex flex-col gap-1">
          <label htmlFor="animal-work-number" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            N° travail
          </label>
          <input
            id="animal-work-number"
            type="text"
            value={workNumber}
            onChange={e => setWorkNumber(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
          />
        </div>

        {/* Race / Variété */}
        <div className="flex flex-col gap-1">
          <label htmlFor="animal-variety" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            Race / Variété
          </label>
          <input
            id="animal-variety"
            type="text"
            value={variety}
            onChange={e => setVariety(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
          />
        </div>

        {/* N° identification */}
        <div className="flex flex-col gap-1">
          <label htmlFor="animal-identification" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            N° identification
          </label>
          <input
            id="animal-identification"
            type="text"
            value={identificationNumber}
            onChange={e => setIdentificationNumber(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="animal-born-at" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Date de naissance
            </label>
            <input
              id="animal-born-at"
              type="date"
              value={bornAt}
              onChange={e => setBornAt(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="animal-dead-at" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Date de décès
            </label>
            <input
              id="animal-dead-at"
              type="date"
              value={deadAt}
              onChange={e => setDeadAt(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
            />
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label htmlFor="animal-description" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            Description
          </label>
          <textarea
            id="animal-description"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-y"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--color-primary)' }}
          >
            <Save size={15} />
            {isEdit ? 'Enregistrer' : 'Créer'}
          </button>
          <a href="/backend/animals" className="flex items-center rounded-md border px-4 py-2 text-sm font-medium no-underline"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            Annuler
          </a>
        </div>
      </form>
    </div>
  )
}

Form.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

---

- [ ] **Step 5: Run tests to verify they pass**

```bash
yarn vitest run app/frontend/pages/Backend/Animaux/Form.test.tsx --reporter=verbose
```

Expected: **6/6 PASS**

---

- [ ] **Step 6: TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

---

- [ ] **Step 7: Extend Rails controller for Animaux**

Open `app/controllers/backend/animals_controller.rb`.

**Change 1** — extend the layout line (currently `only: [:index, :show]`):

```ruby
# Before:
layout 'inertia', only: [:index, :show]

# After:
layout 'inertia', only: [:index, :show, :new, :edit]
```

**Change 2** — add actions after the existing `show` action, and add private helpers at the end of the private section:

Add these public actions (insert after `show`):

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
```

Add these private helpers (inside the `private` section, at the end of the file before the final `end`):

```ruby
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

---

- [ ] **Step 8: Rubocop check**

```bash
bundle exec rubocop app/controllers/backend/animals_controller.rb -a
```

Expected: no offenses (or auto-corrected).

---

- [ ] **Step 9: Commit Task 1**

```bash
git add \
  app/frontend/types/animal.ts \
  app/frontend/pages/Backend/Animaux/Form.tsx \
  app/frontend/pages/Backend/Animaux/Form.test.tsx \
  app/controllers/backend/animals_controller.rb
git commit -m "feat: add Animaux Form page (new/edit/create/update) with tests"
```

---

## Task 2: Travailleurs Form

**Files:**
- Modify: `app/frontend/types/travailleur.ts`
- Create: `app/frontend/pages/Backend/Travailleurs/Form.tsx`
- Create: `app/frontend/pages/Backend/Travailleurs/Form.test.tsx`
- Modify: `app/controllers/backend/workers_controller.rb`

---

- [ ] **Step 1: Add TravailleurFormProps to type file**

Open `app/frontend/types/travailleur.ts`. Append at the **end of the file**:

```typescript
export interface TravailleurFormProps {
  travailleur: (TravailleurDetail & { id?: number }) | null
  errors: Record<string, string[]>
}
```

---

- [ ] **Step 2: Write the failing tests**

Create `app/frontend/pages/Backend/Travailleurs/Form.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Form from './Form'
import type { TravailleurFormProps } from '../../../types/travailleur'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), patch: vi.fn() },
}))

import { router } from '@inertiajs/react'

const mockTravailleur = {
  id: 1,
  name: 'Mamadou Diallo',
  number: 'TR-001',
  work_number: 'W-001',
  identification_number: 'ID-001',
  born_at: '1985-03-20',
  dead_at: null,
  description: 'Tractoriste principal',
  interventions: [],
}

function renderForm(props: TravailleurFormProps) {
  return render(<Form {...props} />)
}

describe('Travailleurs Form', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "Nouveau travailleur" heading on create', () => {
    renderForm({ travailleur: null, errors: {} })
    expect(screen.getByRole('heading', { name: /Nouveau travailleur/i })).toBeInTheDocument()
  })

  it('shows "Modifier le travailleur {name}" heading on edit', () => {
    renderForm({ travailleur: mockTravailleur, errors: {} })
    expect(screen.getByRole('heading', { name: /Modifier le travailleur Mamadou Diallo/i })).toBeInTheDocument()
  })

  it('renders name input as required', () => {
    renderForm({ travailleur: null, errors: {} })
    const input = screen.getByLabelText(/^Nom/i)
    expect(input).toBeInTheDocument()
    expect(input).toBeRequired()
  })

  it('renders born_at date input', () => {
    renderForm({ travailleur: null, errors: {} })
    expect(screen.getByLabelText(/Date de naissance/i)).toBeInTheDocument()
  })

  it('calls router.post on new form submit', async () => {
    renderForm({ travailleur: null, errors: {} })
    fireEvent.change(screen.getByLabelText(/^Nom/i), { target: { value: 'Ibrahim Sow' } })
    fireEvent.submit(screen.getByRole('form'))
    expect(router.post).toHaveBeenCalledWith(
      '/backend/workers',
      expect.objectContaining({ 'worker[name]': 'Ibrahim Sow' }),
      expect.any(Object)
    )
  })

  it('calls router.patch on edit form submit', async () => {
    renderForm({ travailleur: mockTravailleur, errors: {} })
    fireEvent.submit(screen.getByRole('form'))
    expect(router.patch).toHaveBeenCalledWith(
      '/backend/workers/1',
      expect.objectContaining({ 'worker[name]': 'Mamadou Diallo' }),
      expect.any(Object)
    )
  })
})
```

---

- [ ] **Step 3: Run tests to verify they fail**

```bash
yarn vitest run app/frontend/pages/Backend/Travailleurs/Form.test.tsx --reporter=verbose
```

Expected: **FAIL** — `Cannot find module './Form'`

---

- [ ] **Step 4: Create Form.tsx**

Create `app/frontend/pages/Backend/Travailleurs/Form.tsx`:

```tsx
import { type ReactNode, useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Save, Users } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { TravailleurFormProps } from '../../../types/travailleur'

function FieldError({ errors, field }: { errors: Record<string, string[]>; field: string }) {
  const msgs = errors[field]
  if (!msgs || msgs.length === 0) return null
  return (
    <p id={`worker-${field}-error`} className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
      {msgs[0]}
    </p>
  )
}

export default function Form({ travailleur, errors }: TravailleurFormProps) {
  const isEdit = travailleur !== null && travailleur.id !== undefined

  const [name, setName] = useState(travailleur?.name ?? '')
  const [workNumber, setWorkNumber] = useState(travailleur?.work_number ?? '')
  const [identificationNumber, setIdentificationNumber] = useState(travailleur?.identification_number ?? '')
  const [bornAt, setBornAt] = useState(travailleur?.born_at ?? '')
  const [deadAt, setDeadAt] = useState(travailleur?.dead_at ?? '')
  const [description, setDescription] = useState(travailleur?.description ?? '')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const data = {
      'worker[name]': name,
      'worker[work_number]': workNumber,
      'worker[identification_number]': identificationNumber,
      'worker[born_at]': bornAt,
      'worker[dead_at]': deadAt,
      'worker[description]': description,
    }
    const opts = { onFinish: () => setSubmitting(false) }
    if (isEdit) {
      router.patch(`/backend/workers/${travailleur!.id}`, data, opts)
    } else {
      router.post('/backend/workers', data, opts)
    }
  }

  const heading = isEdit ? `Modifier le travailleur ${travailleur!.name}` : 'Nouveau travailleur'

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <a href="/backend/workers" className="text-muted hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </a>
        <Users size={22} style={{ color: 'var(--color-primary)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{heading}</h1>
      </div>

      <form
        aria-label="Formulaire travailleur"
        onSubmit={handleSubmit}
        className="rounded-lg border p-6 flex flex-col gap-5"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        {/* Nom */}
        <div className="flex flex-col gap-1">
          <label htmlFor="worker-name" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            Nom <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <input
            id="worker-name"
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'worker-name-error' : undefined}
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: errors.name ? 'var(--color-danger)' : 'var(--color-border)', background: 'var(--color-bg)' }}
          />
          <FieldError errors={errors} field="name" />
        </div>

        {/* N° travail */}
        <div className="flex flex-col gap-1">
          <label htmlFor="worker-work-number" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            N° travail
          </label>
          <input
            id="worker-work-number"
            type="text"
            value={workNumber}
            onChange={e => setWorkNumber(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
          />
        </div>

        {/* N° identification */}
        <div className="flex flex-col gap-1">
          <label htmlFor="worker-identification" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            N° identification
          </label>
          <input
            id="worker-identification"
            type="text"
            value={identificationNumber}
            onChange={e => setIdentificationNumber(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="worker-born-at" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Date de naissance
            </label>
            <input
              id="worker-born-at"
              type="date"
              value={bornAt}
              onChange={e => setBornAt(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="worker-dead-at" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Date de départ
            </label>
            <input
              id="worker-dead-at"
              type="date"
              value={deadAt}
              onChange={e => setDeadAt(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
            />
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label htmlFor="worker-description" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            Description
          </label>
          <textarea
            id="worker-description"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-y"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--color-primary)' }}
          >
            <Save size={15} />
            {isEdit ? 'Enregistrer' : 'Créer'}
          </button>
          <a href="/backend/workers" className="flex items-center rounded-md border px-4 py-2 text-sm font-medium no-underline"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            Annuler
          </a>
        </div>
      </form>
    </div>
  )
}

Form.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

---

- [ ] **Step 5: Run tests to verify they pass**

```bash
yarn vitest run app/frontend/pages/Backend/Travailleurs/Form.test.tsx --reporter=verbose
```

Expected: **6/6 PASS**

---

- [ ] **Step 6: TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

---

- [ ] **Step 7: Extend Rails controller for Workers**

Open `app/controllers/backend/workers_controller.rb`.

**Change 1** — extend the layout line (currently `only: [:index, :show]`):

```ruby
# Before:
layout 'inertia', only: [:index, :show]

# After:
layout 'inertia', only: [:index, :show, :new, :edit]
```

**Change 2** — add actions after the existing `show` action, and add private helpers at the end of the private section:

Add these public actions (insert after `show`):

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
```

Add these private helpers (inside the `private` section, at the end of the file before the final `end`):

```ruby
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

- [ ] **Step 8: Rubocop check**

```bash
bundle exec rubocop app/controllers/backend/workers_controller.rb -a
```

Expected: no offenses (or auto-corrected).

---

- [ ] **Step 9: Full test suite sanity check**

```bash
yarn vitest run app/frontend/pages/Backend/Animaux/ app/frontend/pages/Backend/Travailleurs/ --reporter=verbose
```

Expected: **12/12 PASS**

---

- [ ] **Step 10: Commit Task 2**

```bash
git add \
  app/frontend/types/travailleur.ts \
  app/frontend/pages/Backend/Travailleurs/Form.tsx \
  app/frontend/pages/Backend/Travailleurs/Form.test.tsx \
  app/controllers/backend/workers_controller.rb
git commit -m "feat: add Travailleurs Form page (new/edit/create/update) with tests"
```
