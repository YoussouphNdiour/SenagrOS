# Design System Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre 100% du frontend SenagrOS en conformité avec le design system — Tailwind + `var(--color-*)`, aucun hexcode hardcodé, aucun inline style de layout, 20 composants partagés dans `components/ui/`.

**Architecture:** Phase 1 → tokens.css. Phase 2 → 20 primitives dans `components/ui/`. Phase 3 → conversion de toutes les pages Index (15 fichiers). Phase 4 → conversion des pages Form (~14 fichiers). Phase 5 → conversion des pages Show (~14 fichiers).

**Tech Stack:** React 18, TypeScript strict, Tailwind CSS v4, CSS custom properties (`tokens.css`), Vitest + @testing-library/react, Lucide React

---

## File Map

**Créés :**
- `app/frontend/components/ui/BackLink.tsx`
- `app/frontend/components/ui/IconBox.tsx`
- `app/frontend/components/ui/PageHeader.tsx`
- `app/frontend/components/ui/PrimaryButton.tsx`
- `app/frontend/components/ui/SectionCard.tsx`
- `app/frontend/components/ui/SectionTitle.tsx`
- `app/frontend/components/ui/DetailRow.tsx`
- `app/frontend/components/ui/StateBadge.tsx`
- `app/frontend/components/ui/CodeBadge.tsx`
- `app/frontend/components/ui/KpiCard.tsx`
- `app/frontend/components/ui/EmptyState.tsx`
- `app/frontend/components/ui/Pagination.tsx`
- `app/frontend/components/ui/ProgressBar.tsx`
- `app/frontend/components/ui/ViewToggle.tsx`
- `app/frontend/components/ui/FilterBar.tsx`
- `app/frontend/components/ui/DataTable.tsx`
- `app/frontend/components/ui/ActionGroup.tsx`
- `app/frontend/components/ui/ConfirmDeleteButton.tsx`
- `app/frontend/components/ui/FormField.tsx`
- `app/frontend/components/ui/TabNav.tsx`
- `app/frontend/components/ui/index.ts`
- Tests unitaires pour chaque composant ci-dessus

**Modifiés :**
- `app/frontend/styles/tokens.css` — 4 tokens ajoutés
- `app/frontend/pages/Backend/Interventions/Index.tsx`
- `app/frontend/pages/Backend/Parcelles/Index.tsx`
- `app/frontend/pages/Backend/Productions/Index.tsx`
- `app/frontend/pages/Backend/Ventes/Index.tsx`
- `app/frontend/pages/Backend/Achats/CommandesIndex.tsx`
- `app/frontend/pages/Backend/Achats/FacturesIndex.tsx`
- `app/frontend/pages/Backend/Campagnes/Index.tsx`
- `app/frontend/pages/Backend/Activites/Index.tsx`
- `app/frontend/pages/Backend/Entites/Index.tsx`
- `app/frontend/pages/Backend/Equipements/Index.tsx`
- `app/frontend/pages/Backend/Travailleurs/Index.tsx`
- `app/frontend/pages/Backend/Animaux/Index.tsx`
- `app/frontend/pages/Backend/Catalogue/Index.tsx`
- `app/frontend/pages/Backend/Alertes/Index.tsx`
- `app/frontend/pages/Backend/Budgets/Index.tsx`
- `app/frontend/pages/Backend/Receptions/ReceptionsIndex.tsx`
- Tous les Form.tsx et Show.tsx listés ci-dessous

---

## PHASE 1 — Tokens CSS

### Task 1: Ajouter les tokens manquants dans tokens.css

**Files:**
- Modify: `app/frontend/styles/tokens.css`

- [ ] **Step 1: Ajouter les 4 variables manquantes dans la section Semantic**

Ouvrir `app/frontend/styles/tokens.css`. Après la ligne `--color-info: #1f6f8b;`, ajouter :

```css
  --color-info-bg:        #e0f2fe;
  --color-info-text:      #1f6f8b;
  --color-success-text:   #065f46;
  --color-danger-border:  #fca5a5;
```

Vérifier que `--color-bg-subtle: #f9f7f4;` est déjà présent (ligne ~27). Si absent, l'ajouter dans la section Backgrounds.

- [ ] **Step 2: Vérifier le TypeScript**

```bash
cd ekylibre-main && yarn tsc --noEmit
```

Expected: no errors (tokens.css n'est pas parsé par TS).

- [ ] **Step 3: Commit**

```bash
git add app/frontend/styles/tokens.css
git commit -m "chore: add missing design tokens (info-bg, info-text, success-text, danger-border)"
```

---

## PHASE 2 — Composants partagés

### Task 2: BackLink

**Files:**
- Create: `app/frontend/components/ui/BackLink.tsx`
- Create: `app/frontend/components/ui/BackLink.test.tsx`

- [ ] **Step 1: Écrire le test**

```tsx
// app/frontend/components/ui/BackLink.test.tsx
import { render, screen } from '@testing-library/react'
import { BackLink } from './BackLink'

test('renders link with correct href and label', () => {
  render(<BackLink href="/backend/animals" label="Liste des animaux" />)
  const link = screen.getByRole('link', { name: /liste des animaux/i })
  expect(link).toHaveAttribute('href', '/backend/animals')
})

test('renders ArrowLeft icon', () => {
  const { container } = render(<BackLink href="/backend/animals" label="Retour" />)
  expect(container.querySelector('svg')).toBeTruthy()
})
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
yarn vitest run app/frontend/components/ui/BackLink.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implémenter le composant**

```tsx
// app/frontend/components/ui/BackLink.tsx
import { ArrowLeft } from 'lucide-react'

interface BackLinkProps {
  href: string
  label: string
}

export function BackLink({ href, label }: BackLinkProps) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 text-sm no-underline mb-6"
      style={{ color: 'var(--color-text-muted)' }}
    >
      <ArrowLeft size={16} />
      {label}
    </a>
  )
}
```

- [ ] **Step 4: Vérifier que le test passe**

```bash
yarn vitest run app/frontend/components/ui/BackLink.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/frontend/components/ui/BackLink.tsx app/frontend/components/ui/BackLink.test.tsx
git commit -m "feat: add BackLink ui primitive"
```

---

### Task 3: IconBox

**Files:**
- Create: `app/frontend/components/ui/IconBox.tsx`
- Create: `app/frontend/components/ui/IconBox.test.tsx`

- [ ] **Step 1: Écrire le test**

```tsx
// app/frontend/components/ui/IconBox.test.tsx
import { render } from '@testing-library/react'
import { PawPrint } from 'lucide-react'
import { IconBox } from './IconBox'

test('renders with correct size', () => {
  const { container } = render(
    <IconBox icon={PawPrint} color="#1B6B3A" bg="#d1fae5" size={48} />
  )
  const div = container.firstChild as HTMLElement
  expect(div.style.width).toBe('48px')
  expect(div.style.height).toBe('48px')
})

test('renders with default size 48', () => {
  const { container } = render(
    <IconBox icon={PawPrint} color="#1B6B3A" bg="#d1fae5" />
  )
  const div = container.firstChild as HTMLElement
  expect(div.style.width).toBe('48px')
})
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
yarn vitest run app/frontend/components/ui/IconBox.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implémenter**

```tsx
// app/frontend/components/ui/IconBox.tsx
import type { LucideIcon } from 'lucide-react'

interface IconBoxProps {
  icon: LucideIcon
  color: string
  bg: string
  size?: number
}

export function IconBox({ icon: Icon, color, bg, size = 48 }: IconBoxProps) {
  return (
    <div
      className="flex items-center justify-center rounded-xl shrink-0"
      style={{ width: size, height: size, background: bg }}
    >
      <Icon size={Math.round(size * 0.46)} style={{ color }} />
    </div>
  )
}
```

- [ ] **Step 4: Vérifier que le test passe**

```bash
yarn vitest run app/frontend/components/ui/IconBox.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add app/frontend/components/ui/IconBox.tsx app/frontend/components/ui/IconBox.test.tsx
git commit -m "feat: add IconBox ui primitive"
```

---

### Task 4: PrimaryButton

**Files:**
- Create: `app/frontend/components/ui/PrimaryButton.tsx`
- Create: `app/frontend/components/ui/PrimaryButton.test.tsx`

- [ ] **Step 1: Écrire le test**

```tsx
// app/frontend/components/ui/PrimaryButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { PrimaryButton } from './PrimaryButton'

test('renders as button by default', () => {
  render(<PrimaryButton>Enregistrer</PrimaryButton>)
  expect(screen.getByRole('button', { name: /enregistrer/i })).toBeTruthy()
})

test('renders as anchor when href provided', () => {
  render(<PrimaryButton href="/backend/animals/new">Nouveau</PrimaryButton>)
  const link = screen.getByRole('link', { name: /nouveau/i })
  expect(link).toHaveAttribute('href', '/backend/animals/new')
})

test('calls onClick when clicked', () => {
  const onClick = vi.fn()
  render(<PrimaryButton onClick={onClick}>Click</PrimaryButton>)
  fireEvent.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalledOnce()
})

test('disabled button does not call onClick', () => {
  const onClick = vi.fn()
  render(<PrimaryButton onClick={onClick} disabled>Click</PrimaryButton>)
  fireEvent.click(screen.getByRole('button'))
  expect(onClick).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
yarn vitest run app/frontend/components/ui/PrimaryButton.test.tsx
```

- [ ] **Step 3: Implémenter**

```tsx
// app/frontend/components/ui/PrimaryButton.tsx
import type { ReactNode } from 'react'

interface PrimaryButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md'
  disabled?: boolean
  type?: 'button' | 'submit'
  href?: string
  onClick?: () => void
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
    color: '#fff',
    border: '1px solid var(--color-primary-dark)',
    boxShadow: '0 1px 0 rgba(255,255,255,0.18) inset, 0 1px 3px rgba(0,0,0,0.15)',
  },
  secondary: {
    background: 'var(--color-bg-card)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
  danger: {
    background: 'var(--color-danger-bg)',
    color: 'var(--color-danger-text)',
    border: '1px solid var(--color-danger-border)',
  },
}

export function PrimaryButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled,
  type = 'button',
  href,
  onClick,
}: PrimaryButtonProps) {
  const sizeClass = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
  const base = `inline-flex items-center gap-1.5 rounded-lg font-semibold no-underline ${sizeClass}`
  const cursor = disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'

  if (href) {
    return (
      <a href={href} className={`${base} ${cursor}`} style={variantStyles[variant]}>
        {children}
      </a>
    )
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${cursor}`}
      style={variantStyles[variant]}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Vérifier que le test passe**

```bash
yarn vitest run app/frontend/components/ui/PrimaryButton.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add app/frontend/components/ui/PrimaryButton.tsx app/frontend/components/ui/PrimaryButton.test.tsx
git commit -m "feat: add PrimaryButton ui primitive (primary/secondary/danger variants)"
```

---

### Task 5: PageHeader

**Files:**
- Create: `app/frontend/components/ui/PageHeader.tsx`
- Create: `app/frontend/components/ui/PageHeader.test.tsx`

- [ ] **Step 1: Écrire le test**

```tsx
// app/frontend/components/ui/PageHeader.test.tsx
import { render, screen } from '@testing-library/react'
import { PageHeader } from './PageHeader'

test('renders title', () => {
  render(<PageHeader title="Animaux" />)
  expect(screen.getByText('Animaux')).toBeTruthy()
})

test('renders subtitle when provided', () => {
  render(<PageHeader title="Animaux" subtitle="42 animaux" />)
  expect(screen.getByText('42 animaux')).toBeTruthy()
})

test('renders action slot when provided', () => {
  render(<PageHeader title="Animaux" action={<button>Nouveau</button>} />)
  expect(screen.getByRole('button', { name: /nouveau/i })).toBeTruthy()
})

test('does not render subtitle when absent', () => {
  render(<PageHeader title="Animaux" />)
  expect(screen.queryByRole('paragraph')).toBeNull()
})
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
yarn vitest run app/frontend/components/ui/PageHeader.test.tsx
```

- [ ] **Step 3: Implémenter**

```tsx
// app/frontend/components/ui/PageHeader.tsx
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-5 gap-4">
      <div>
        <h1
          className="text-[26px] font-bold m-0 leading-tight"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
```

- [ ] **Step 4: Vérifier que le test passe**

```bash
yarn vitest run app/frontend/components/ui/PageHeader.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add app/frontend/components/ui/PageHeader.tsx app/frontend/components/ui/PageHeader.test.tsx
git commit -m "feat: add PageHeader ui primitive"
```

---

### Task 6: SectionCard + SectionTitle

**Files:**
- Create: `app/frontend/components/ui/SectionCard.tsx`
- Create: `app/frontend/components/ui/SectionTitle.tsx`
- Create: `app/frontend/components/ui/SectionCard.test.tsx`

- [ ] **Step 1: Écrire le test**

```tsx
// app/frontend/components/ui/SectionCard.test.tsx
import { render, screen } from '@testing-library/react'
import { Beef } from 'lucide-react'
import { SectionCard } from './SectionCard'
import { SectionTitle } from './SectionTitle'

test('SectionCard renders children', () => {
  render(<SectionCard><p>contenu</p></SectionCard>)
  expect(screen.getByText('contenu')).toBeTruthy()
})

test('SectionCard with noPadding has no padding class', () => {
  const { container } = render(<SectionCard noPadding><p>x</p></SectionCard>)
  expect(container.firstChild).not.toHaveClass('p-6')
})

test('SectionTitle renders text and icon', () => {
  const { container } = render(<SectionTitle icon={Beef}>Informations</SectionTitle>)
  expect(screen.getByText('Informations')).toBeTruthy()
  expect(container.querySelector('svg')).toBeTruthy()
})
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
yarn vitest run app/frontend/components/ui/SectionCard.test.tsx
```

- [ ] **Step 3: Implémenter SectionCard**

```tsx
// app/frontend/components/ui/SectionCard.tsx
import type { ReactNode } from 'react'

interface SectionCardProps {
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function SectionCard({ children, className = '', noPadding }: SectionCardProps) {
  return (
    <div
      className={`rounded-[var(--radius-card)] overflow-hidden ${noPadding ? '' : 'p-6'} ${className}`}
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Implémenter SectionTitle**

```tsx
// app/frontend/components/ui/SectionTitle.tsx
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface SectionTitleProps {
  icon?: LucideIcon
  children: ReactNode
}

export function SectionTitle({ icon: Icon, children }: SectionTitleProps) {
  return (
    <h2
      className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest mb-4 m-0"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {Icon && <Icon size={14} />}
      {children}
    </h2>
  )
}
```

- [ ] **Step 5: Vérifier que le test passe**

```bash
yarn vitest run app/frontend/components/ui/SectionCard.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add app/frontend/components/ui/SectionCard.tsx app/frontend/components/ui/SectionTitle.tsx app/frontend/components/ui/SectionCard.test.tsx
git commit -m "feat: add SectionCard and SectionTitle ui primitives"
```

---

### Task 7: StateBadge + CodeBadge

**Files:**
- Create: `app/frontend/components/ui/StateBadge.tsx`
- Create: `app/frontend/components/ui/CodeBadge.tsx`
- Create: `app/frontend/components/ui/StateBadge.test.tsx`

- [ ] **Step 1: Écrire le test**

```tsx
// app/frontend/components/ui/StateBadge.test.tsx
import { render, screen } from '@testing-library/react'
import { StateBadge } from './StateBadge'
import { CodeBadge } from './CodeBadge'

test('StateBadge renders label', () => {
  render(<StateBadge label="En cours" color="var(--color-warning)" bg="var(--color-warning-bg)" />)
  expect(screen.getByText('En cours')).toBeTruthy()
})

test('StateBadge renders dot by default', () => {
  const { container } = render(
    <StateBadge label="En cours" color="var(--color-warning)" bg="var(--color-warning-bg)" />
  )
  // dot is a span inside the badge
  const spans = container.querySelectorAll('span')
  expect(spans.length).toBeGreaterThanOrEqual(2)
})

test('StateBadge hides dot when dot=false', () => {
  const { container } = render(
    <StateBadge label="En cours" color="var(--color-warning)" bg="var(--color-warning-bg)" dot={false} />
  )
  const spans = container.querySelectorAll('span')
  expect(spans.length).toBe(1)
})

test('CodeBadge default renders with info style', () => {
  render(<CodeBadge value="ANA-001" />)
  expect(screen.getByText('ANA-001')).toBeTruthy()
})

test('CodeBadge warning variant renders', () => {
  render(<CodeBadge value="Code manquant" variant="warning" />)
  expect(screen.getByText('Code manquant')).toBeTruthy()
})
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
yarn vitest run app/frontend/components/ui/StateBadge.test.tsx
```

- [ ] **Step 3: Implémenter StateBadge**

```tsx
// app/frontend/components/ui/StateBadge.tsx
interface StateBadgeProps {
  label: string
  color: string
  bg: string
  border?: string
  dot?: boolean
}

export function StateBadge({ label, color, bg, border, dot = true }: StateBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: bg, color, border: border ? `1px solid ${border}` : undefined }}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      )}
      {label}
    </span>
  )
}
```

- [ ] **Step 4: Implémenter CodeBadge**

```tsx
// app/frontend/components/ui/CodeBadge.tsx
interface CodeBadgeProps {
  value: string
  variant?: 'default' | 'warning'
}

export function CodeBadge({ value, variant = 'default' }: CodeBadgeProps) {
  const styles =
    variant === 'warning'
      ? { background: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' }
      : { background: 'var(--color-info-bg)', color: 'var(--color-info-text)' }

  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-bold font-mono whitespace-nowrap shrink-0"
      style={styles}
    >
      {value}
    </span>
  )
}
```

- [ ] **Step 5: Vérifier que le test passe**

```bash
yarn vitest run app/frontend/components/ui/StateBadge.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add app/frontend/components/ui/StateBadge.tsx app/frontend/components/ui/CodeBadge.tsx app/frontend/components/ui/StateBadge.test.tsx
git commit -m "feat: add StateBadge and CodeBadge ui primitives"
```

---

### Task 8: KpiCard + EmptyState + ProgressBar

**Files:**
- Create: `app/frontend/components/ui/KpiCard.tsx`
- Create: `app/frontend/components/ui/EmptyState.tsx`
- Create: `app/frontend/components/ui/ProgressBar.tsx`
- Create: `app/frontend/components/ui/KpiCard.test.tsx`

- [ ] **Step 1: Écrire le test**

```tsx
// app/frontend/components/ui/KpiCard.test.tsx
import { render, screen } from '@testing-library/react'
import { Wallet } from 'lucide-react'
import { KpiCard } from './KpiCard'
import { EmptyState } from './EmptyState'
import { ProgressBar } from './ProgressBar'

test('KpiCard renders label and value', () => {
  render(<KpiCard icon={<Wallet size={16} />} label="Total budgets" value={42} color="var(--color-primary)" />)
  expect(screen.getByText('Total budgets')).toBeTruthy()
  expect(screen.getByText('42')).toBeTruthy()
})

test('EmptyState renders message', () => {
  render(<EmptyState icon={Wallet} message="Aucun budget" />)
  expect(screen.getByText('Aucun budget')).toBeTruthy()
})

test('ProgressBar renders track and fill', () => {
  const { container } = render(<ProgressBar value={3} max={5} label="3/5 reçus" />)
  expect(screen.getByText('3/5 reçus')).toBeTruthy()
  const fill = container.querySelectorAll('div')[1]
  expect(fill.style.width).toBe('60%')
})

test('ProgressBar clamps at 100%', () => {
  const { container } = render(<ProgressBar value={10} max={5} />)
  const fill = container.querySelectorAll('div')[1]
  expect(fill.style.width).toBe('100%')
})

test('ProgressBar with max=0 shows 0%', () => {
  const { container } = render(<ProgressBar value={0} max={0} />)
  const fill = container.querySelectorAll('div')[1]
  expect(fill.style.width).toBe('0%')
})
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
yarn vitest run app/frontend/components/ui/KpiCard.test.tsx
```

- [ ] **Step 3: Implémenter KpiCard**

```tsx
// app/frontend/components/ui/KpiCard.tsx
import type { ReactNode } from 'react'

interface KpiCardProps {
  icon: ReactNode
  label: string
  value: string | number
  color: string
}

export function KpiCard({ icon, label, value, color }: KpiCardProps) {
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-[var(--radius-card)]"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <span
        className="w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0"
        style={{ background: `${color}1a`, color }}
      >
        {icon}
      </span>
      <div>
        <div
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {label}
        </div>
        <div
          className="text-[22px] font-bold leading-tight"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
        >
          {value}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implémenter EmptyState**

```tsx
// app/frontend/components/ui/EmptyState.tsx
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  message: string
  colSpan?: number
}

export function EmptyState({ icon: Icon, message, colSpan }: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center gap-3 py-12" style={{ color: 'var(--color-text-muted)' }}>
      <Icon size={32} style={{ opacity: 0.3 }} />
      <p className="text-sm m-0">{message}</p>
    </div>
  )

  if (colSpan !== undefined) {
    return (
      <tr>
        <td colSpan={colSpan} className="p-0">
          {content}
        </td>
      </tr>
    )
  }

  return content
}
```

- [ ] **Step 5: Implémenter ProgressBar**

```tsx
// app/frontend/components/ui/ProgressBar.tsx
interface ProgressBarProps {
  value: number
  max: number
  fillColor?: string
  height?: number
  label?: string
}

export function ProgressBar({
  value,
  max,
  fillColor = 'var(--color-primary)',
  height = 4,
  label,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0

  return (
    <div className="flex items-center gap-2 mt-2">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ background: 'var(--color-border)', height }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: fillColor, transition: 'width 0.3s' }}
        />
      </div>
      {label && (
        <span className="text-[11px] whitespace-nowrap shrink-0" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Vérifier que le test passe**

```bash
yarn vitest run app/frontend/components/ui/KpiCard.test.tsx
```

- [ ] **Step 7: Commit**

```bash
git add app/frontend/components/ui/KpiCard.tsx app/frontend/components/ui/EmptyState.tsx app/frontend/components/ui/ProgressBar.tsx app/frontend/components/ui/KpiCard.test.tsx
git commit -m "feat: add KpiCard, EmptyState, ProgressBar ui primitives"
```

---

### Task 9: Pagination + ViewToggle + FilterBar

**Files:**
- Create: `app/frontend/components/ui/Pagination.tsx`
- Create: `app/frontend/components/ui/ViewToggle.tsx`
- Create: `app/frontend/components/ui/FilterBar.tsx`
- Create: `app/frontend/components/ui/Pagination.test.tsx`

- [ ] **Step 1: Écrire le test**

```tsx
// app/frontend/components/ui/Pagination.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { List } from 'lucide-react'
import { Pagination } from './Pagination'
import { ViewToggle } from './ViewToggle'
import { FilterBar } from './FilterBar'

test('Pagination renders page info', () => {
  render(<Pagination page={2} totalPages={5} total={48} onPrev={vi.fn()} onNext={vi.fn()} />)
  expect(screen.getByText(/page 2 sur 5/i)).toBeTruthy()
  expect(screen.getByText(/48 résultats/i)).toBeTruthy()
})

test('Pagination calls onPrev', () => {
  const onPrev = vi.fn()
  render(<Pagination page={2} totalPages={5} total={48} onPrev={onPrev} onNext={vi.fn()} />)
  fireEvent.click(screen.getByText(/précédent/i))
  expect(onPrev).toHaveBeenCalledOnce()
})

test('Pagination disables Précédent on first page', () => {
  render(<Pagination page={1} totalPages={5} total={48} onPrev={vi.fn()} onNext={vi.fn()} />)
  expect(screen.getByText(/précédent/i).closest('button')).toBeDisabled()
})

test('Pagination disables Suivant on last page', () => {
  render(<Pagination page={5} totalPages={5} total={48} onPrev={vi.fn()} onNext={vi.fn()} />)
  expect(screen.getByText(/suivant/i).closest('button')).toBeDisabled()
})

test('ViewToggle renders views and calls onChange', () => {
  const onChange = vi.fn()
  render(
    <ViewToggle
      views={[{ key: 'list', label: 'Liste', icon: List }]}
      active="list"
      onChange={onChange}
    />
  )
  fireEvent.click(screen.getByText('Liste'))
  expect(onChange).toHaveBeenCalledWith('list')
})

test('FilterBar renders children', () => {
  render(<FilterBar><input placeholder="Chercher" /></FilterBar>)
  expect(screen.getByPlaceholderText('Chercher')).toBeTruthy()
})
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
yarn vitest run app/frontend/components/ui/Pagination.test.tsx
```

- [ ] **Step 3: Implémenter Pagination**

```tsx
// app/frontend/components/ui/Pagination.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  onPrev: () => void
  onNext: () => void
}

export function Pagination({ page, totalPages, total, onPrev, onNext }: PaginationProps) {
  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-t"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
    >
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Page {page} sur {totalPages} — {total} résultats
      </span>
      <div className="flex gap-1.5">
        {(['prev', 'next'] as const).map((dir) => {
          const isActive = dir === 'prev' ? hasPrev : hasNext
          return (
            <button
              key={dir}
              onClick={dir === 'prev' ? onPrev : onNext}
              disabled={!isActive}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs border"
              style={{
                background: 'var(--color-bg-card)',
                borderColor: 'var(--color-border)',
                color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                cursor: isActive ? 'pointer' : 'not-allowed',
              }}
            >
              {dir === 'prev' ? <><ChevronLeft size={13} /> Précédent</> : <>Suivant <ChevronRight size={13} /></>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implémenter ViewToggle**

```tsx
// app/frontend/components/ui/ViewToggle.tsx
import type { LucideIcon } from 'lucide-react'

interface ViewToggleProps {
  views: Array<{ key: string; label: string; icon: LucideIcon }>
  active: string
  onChange: (key: string) => void
}

export function ViewToggle({ views, active, onChange }: ViewToggleProps) {
  return (
    <div className="flex gap-1.5">
      {views.map(({ key, label, icon: Icon }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer"
            style={{
              background: isActive ? 'var(--color-bg-highlight)' : 'var(--color-bg-card)',
              borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 5: Implémenter FilterBar**

```tsx
// app/frontend/components/ui/FilterBar.tsx
import type { ReactNode } from 'react'

interface FilterBarProps {
  children: ReactNode
}

export function FilterBar({ children }: FilterBarProps) {
  return (
    <div
      className="flex gap-2.5 items-center flex-wrap p-3 rounded-[var(--radius-card)] mb-4"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 6: Vérifier que le test passe**

```bash
yarn vitest run app/frontend/components/ui/Pagination.test.tsx
```

- [ ] **Step 7: Commit**

```bash
git add app/frontend/components/ui/Pagination.tsx app/frontend/components/ui/ViewToggle.tsx app/frontend/components/ui/FilterBar.tsx app/frontend/components/ui/Pagination.test.tsx
git commit -m "feat: add Pagination, ViewToggle, FilterBar ui primitives"
```

---

### Task 10: DetailRow + DataTable

**Files:**
- Create: `app/frontend/components/ui/DetailRow.tsx`
- Create: `app/frontend/components/ui/DataTable.tsx`
- Create: `app/frontend/components/ui/DetailRow.test.tsx`

- [ ] **Step 1: Écrire le test**

```tsx
// app/frontend/components/ui/DetailRow.test.tsx
import { render, screen } from '@testing-library/react'
import { DetailRow } from './DetailRow'
import { DataTable } from './DataTable'

test('DetailRow renders label/value pairs', () => {
  render(
    <DetailRow items={[
      { label: 'Nom', value: 'Bœuf Alpha' },
      { label: 'Race', value: 'Ndama' },
    ]} />
  )
  expect(screen.getByText('Nom')).toBeTruthy()
  expect(screen.getByText('Bœuf Alpha')).toBeTruthy()
  expect(screen.getByText('Ndama')).toBeTruthy()
})

test('DetailRow renders — for null/undefined', () => {
  render(<DetailRow items={[{ label: 'Date', value: null }]} />)
  expect(screen.getByText('—')).toBeTruthy()
})

test('DataTable renders column headers', () => {
  render(
    <table><DataTable
      columns={[{ key: 'name', label: 'Nom' }, { key: 'state', label: 'État' }]}
      data={[]}
      renderRow={() => null}
    /></table>
  )
  expect(screen.getByText('Nom')).toBeTruthy()
  expect(screen.getByText('État')).toBeTruthy()
})

test('DataTable renders empty message when no data', () => {
  render(
    <table><DataTable
      columns={[{ key: 'name', label: 'Nom' }]}
      data={[]}
      renderRow={() => null}
      emptyMessage="Aucun animal"
    /></table>
  )
  expect(screen.getByText('Aucun animal')).toBeTruthy()
})
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
yarn vitest run app/frontend/components/ui/DetailRow.test.tsx
```

- [ ] **Step 3: Implémenter DetailRow**

```tsx
// app/frontend/components/ui/DetailRow.tsx
import type { ReactNode } from 'react'

interface DetailItem {
  label: string
  value: ReactNode
  fullWidth?: boolean
}

interface DetailRowProps {
  items: DetailItem[]
  cols?: 2 | 3
}

export function DetailRow({ items, cols = 2 }: DetailRowProps) {
  return (
    <dl className={`grid gap-x-6 gap-y-3 ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {items.map(({ label, value, fullWidth }) => (
        <div key={label} className={fullWidth ? 'col-span-full' : ''}>
          <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {label}
          </dt>
          <dd className="text-sm font-medium m-0" style={{ color: 'var(--color-text)' }}>
            {value ?? '—'}
          </dd>
        </div>
      ))}
    </dl>
  )
}
```

- [ ] **Step 4: Implémenter DataTable**

```tsx
// app/frontend/components/ui/DataTable.tsx
import type { ReactNode } from 'react'

interface Column {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
}

interface DataTableProps<T> {
  columns: Column[]
  data: T[]
  renderRow: (item: T, index: number) => ReactNode
  footer?: ReactNode
  emptyMessage?: string
}

export function DataTable<T>({
  columns,
  data,
  renderRow,
  footer,
  emptyMessage = 'Aucun élément',
}: DataTableProps<T>) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr style={{ background: 'var(--color-bg)' }}>
          {columns.map((col) => (
            <th
              key={col.key}
              className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest border-b text-${col.align ?? 'left'}`}
              style={{
                color: 'var(--color-text-muted)',
                borderColor: 'var(--color-border)',
                fontFamily: 'var(--font-ui)',
              }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="p-8 text-center text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((item, index) => renderRow(item, index))
        )}
      </tbody>
      {footer && <tfoot>{footer}</tfoot>}
    </table>
  )
}
```

- [ ] **Step 5: Vérifier que le test passe**

```bash
yarn vitest run app/frontend/components/ui/DetailRow.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add app/frontend/components/ui/DetailRow.tsx app/frontend/components/ui/DataTable.tsx app/frontend/components/ui/DetailRow.test.tsx
git commit -m "feat: add DetailRow and DataTable ui primitives"
```

---

### Task 11: ActionGroup + ConfirmDeleteButton + FormField + TabNav

**Files:**
- Create: `app/frontend/components/ui/ActionGroup.tsx`
- Create: `app/frontend/components/ui/ConfirmDeleteButton.tsx`
- Create: `app/frontend/components/ui/FormField.tsx`
- Create: `app/frontend/components/ui/TabNav.tsx`
- Create: `app/frontend/components/ui/ActionGroup.test.tsx`

- [ ] **Step 1: Écrire le test**

```tsx
// app/frontend/components/ui/ActionGroup.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Edit } from 'lucide-react'
import { ActionGroup } from './ActionGroup'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { FormField } from './FormField'
import { TabNav } from './TabNav'

test('ActionGroup renders buttons', () => {
  const onClick = vi.fn()
  render(
    <ActionGroup actions={[{ label: 'Modifier', icon: Edit, onClick, variant: 'secondary' }]} />
  )
  fireEvent.click(screen.getByText('Modifier'))
  expect(onClick).toHaveBeenCalledOnce()
})

test('ConfirmDeleteButton shows confirm dialog', () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  const onDelete = vi.fn()
  render(<ConfirmDeleteButton onDelete={onDelete} />)
  fireEvent.click(screen.getByText('Supprimer'))
  expect(window.confirm).toHaveBeenCalled()
  expect(onDelete).toHaveBeenCalledOnce()
  vi.restoreAllMocks()
})

test('ConfirmDeleteButton does not call onDelete when cancelled', () => {
  vi.spyOn(window, 'confirm').mockReturnValue(false)
  const onDelete = vi.fn()
  render(<ConfirmDeleteButton onDelete={onDelete} />)
  fireEvent.click(screen.getByText('Supprimer'))
  expect(onDelete).not.toHaveBeenCalled()
  vi.restoreAllMocks()
})

test('FormField renders label and children', () => {
  render(
    <FormField label="Nom" htmlFor="name">
      <input id="name" />
    </FormField>
  )
  expect(screen.getByText('Nom')).toBeTruthy()
})

test('FormField renders error', () => {
  render(
    <FormField label="Nom" error="Ce champ est requis">
      <input />
    </FormField>
  )
  expect(screen.getByText('Ce champ est requis')).toBeTruthy()
})

test('FormField renders required asterisk', () => {
  render(<FormField label="Nom" required><input /></FormField>)
  expect(screen.getByText('*')).toBeTruthy()
})

test('TabNav renders active tab', () => {
  render(
    <TabNav tabs={[
      { href: '/commandes', label: 'Commandes', active: true },
      { href: '/factures', label: 'Factures', active: false },
    ]} />
  )
  expect(screen.getByText('Commandes')).toBeTruthy()
  expect(screen.getByText('Factures')).toBeTruthy()
})
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
yarn vitest run app/frontend/components/ui/ActionGroup.test.tsx
```

- [ ] **Step 3: Implémenter ActionGroup**

```tsx
// app/frontend/components/ui/ActionGroup.tsx
import type { LucideIcon } from 'lucide-react'
import { PrimaryButton } from './PrimaryButton'

interface Action {
  label: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

interface ActionGroupProps {
  actions: Action[]
}

export function ActionGroup({ actions }: ActionGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ label, icon: Icon, onClick, variant = 'secondary', disabled }) => (
        <PrimaryButton key={label} variant={variant} onClick={onClick} disabled={disabled}>
          <Icon size={15} />
          {label}
        </PrimaryButton>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Implémenter ConfirmDeleteButton**

```tsx
// app/frontend/components/ui/ConfirmDeleteButton.tsx
import { Trash2 } from 'lucide-react'
import { PrimaryButton } from './PrimaryButton'

interface ConfirmDeleteButtonProps {
  onDelete: () => void
  message?: string
  label?: string
  size?: 'sm' | 'md'
}

export function ConfirmDeleteButton({
  onDelete,
  message = 'Supprimer cet élément ?',
  label = 'Supprimer',
  size = 'md',
}: ConfirmDeleteButtonProps) {
  function handleClick() {
    if (window.confirm(message)) onDelete()
  }

  return (
    <PrimaryButton variant="danger" size={size} onClick={handleClick}>
      <Trash2 size={size === 'sm' ? 13 : 15} />
      {label}
    </PrimaryButton>
  )
}
```

- [ ] **Step 5: Implémenter FormField**

```tsx
// app/frontend/components/ui/FormField.tsx
import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  help?: string
  htmlFor?: string
  children: ReactNode
}

export function FormField({ label, required, error, help, htmlFor, children }: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium mb-1"
        style={{ color: 'var(--color-text)' }}
      >
        {label}
        {required && (
          <span className="ml-0.5" style={{ color: 'var(--color-danger)' }}>*</span>
        )}
      </label>
      {children}
      {help && !error && (
        <p className="text-xs mt-1 m-0" style={{ color: 'var(--color-text-muted)' }}>{help}</p>
      )}
      {error && (
        <p className="text-xs mt-1 m-0" style={{ color: 'var(--color-danger)' }}>{error}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Implémenter TabNav**

```tsx
// app/frontend/components/ui/TabNav.tsx
interface Tab {
  href: string
  label: string
  active: boolean
}

interface TabNavProps {
  tabs: Tab[]
}

export function TabNav({ tabs }: TabNavProps) {
  return (
    <div className="flex border-b mb-5" style={{ borderColor: 'var(--color-border)' }}>
      {tabs.map(({ href, label, active }) => (
        <a
          key={href}
          href={href}
          className="px-5 py-2 text-sm font-medium no-underline -mb-px border-b-2"
          style={{
            borderColor: active ? 'var(--color-primary)' : 'transparent',
            color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }}
        >
          {label}
        </a>
      ))}
    </div>
  )
}
```

- [ ] **Step 7: Vérifier que le test passe**

```bash
yarn vitest run app/frontend/components/ui/ActionGroup.test.tsx
```

- [ ] **Step 8: Commit**

```bash
git add app/frontend/components/ui/ActionGroup.tsx app/frontend/components/ui/ConfirmDeleteButton.tsx app/frontend/components/ui/FormField.tsx app/frontend/components/ui/TabNav.tsx app/frontend/components/ui/ActionGroup.test.tsx
git commit -m "feat: add ActionGroup, ConfirmDeleteButton, FormField, TabNav ui primitives"
```

---

### Task 12: Barrel export + TypeScript check

**Files:**
- Create: `app/frontend/components/ui/index.ts`

- [ ] **Step 1: Créer le barrel export**

```ts
// app/frontend/components/ui/index.ts
export { BackLink } from './BackLink'
export { IconBox } from './IconBox'
export { PageHeader } from './PageHeader'
export { PrimaryButton } from './PrimaryButton'
export { SectionCard } from './SectionCard'
export { SectionTitle } from './SectionTitle'
export { DetailRow } from './DetailRow'
export { StateBadge } from './StateBadge'
export { CodeBadge } from './CodeBadge'
export { KpiCard } from './KpiCard'
export { EmptyState } from './EmptyState'
export { Pagination } from './Pagination'
export { ProgressBar } from './ProgressBar'
export { ViewToggle } from './ViewToggle'
export { FilterBar } from './FilterBar'
export { DataTable } from './DataTable'
export { ActionGroup } from './ActionGroup'
export { ConfirmDeleteButton } from './ConfirmDeleteButton'
export { FormField } from './FormField'
export { TabNav } from './TabNav'
```

- [ ] **Step 2: TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run all component tests**

```bash
yarn vitest run app/frontend/components/ui/
```

Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add app/frontend/components/ui/index.ts
git commit -m "feat: add components/ui barrel export — 20 shared primitives ready"
```

---

## PHASE 3 — Conversion des pages Index

> **Règle de conversion :** Remplacer les inline styles de layout par Tailwind. Remplacer les hexcodes hardcodés par `var(--color-*)`. Utiliser les composants `components/ui/`. Le style inline est conservé uniquement pour les valeurs CSS custom properties ou les valeurs dynamiques.

### Task 13: Animaux/Index.tsx

**Files:**
- Modify: `app/frontend/pages/Backend/Animaux/Index.tsx`

- [ ] **Step 1: Réécrire le fichier**

```tsx
// app/frontend/pages/Backend/Animaux/Index.tsx
import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { Plus, PawPrint, Heart, AlertCircle } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, KpiCard, SectionCard, DataTable, StateBadge, Pagination, PrimaryButton } from '../../../components/ui'
import type { AnimauxIndexProps } from '../../../types/animal'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function AnimauxIndex({ animaux, meta }: AnimauxIndexProps) {
  const totalPages = Math.ceil(meta.total / meta.per_page)
  const alive = animaux.filter(a => !a.dead_at).length
  const dead  = animaux.filter(a => !!a.dead_at).length

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Animaux"
        subtitle={`${meta.total} animal${meta.total !== 1 ? 'aux' : ''}`}
        action={
          <PrimaryButton href="/backend/animals/new">
            <Plus size={14} /> Nouvel animal
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <KpiCard icon={<PawPrint size={16} />} label="Total"   value={meta.total} color="var(--color-warning)" />
        <KpiCard icon={<Heart size={16} />}    label="Vivants" value={alive}       color="var(--color-primary)" />
        <KpiCard icon={<AlertCircle size={16} />} label="Décédés" value={dead}    color="var(--color-danger)" />
        <KpiCard icon={<PawPrint size={16} />} label="Page"    value={`${Math.ceil(meta.total / meta.per_page) > 0 ? meta.page : 1}/${totalPages}`} color="var(--color-text-muted)" />
      </div>

      <SectionCard noPadding>
        <DataTable
          columns={[
            { key: 'name', label: 'Nom' },
            { key: 'work_number', label: 'N° travail' },
            { key: 'variety', label: 'Race / Variété' },
            { key: 'born_at', label: 'Né(e) le' },
            { key: 'state', label: 'État' },
          ]}
          data={animaux}
          emptyMessage="Aucun animal enregistré"
          renderRow={(a, i) => {
            const isAlive = !a.dead_at
            return (
              <tr
                key={a.id}
                className="border-b"
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)',
                  borderColor: 'var(--color-border)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-highlight)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)' }}
              >
                <td className="px-3.5 py-2.5 text-sm">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: isAlive ? 'var(--color-warning-bg)' : 'var(--color-danger-bg)',
                        color: isAlive ? 'var(--color-warning)' : 'var(--color-danger)',
                      }}
                    >
                      <PawPrint size={14} />
                    </span>
                    <a href={`/backend/animals/${a.id}`} className="font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>
                      {a.name}
                    </a>
                  </div>
                </td>
                <td className="px-3.5 py-2.5 text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{a.work_number || '—'}</td>
                <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{a.variety || '—'}</td>
                <td className="px-3.5 py-2.5 text-sm whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>{formatDate(a.born_at)}</td>
                <td className="px-3.5 py-2.5">
                  <StateBadge
                    label={isAlive ? 'Vivant' : 'Décédé'}
                    color={isAlive ? 'var(--color-success)' : 'var(--color-danger)'}
                    bg={isAlive ? 'var(--color-success-bg)' : 'var(--color-danger-bg)'}
                  />
                </td>
              </tr>
            )
          }}
        />
        {totalPages > 1 && (
          <Pagination
            page={meta.page}
            totalPages={totalPages}
            total={meta.total}
            onPrev={() => router.visit(`/backend/animals?page=${meta.page - 1}`)}
            onNext={() => router.visit(`/backend/animals?page=${meta.page + 1}`)}
          />
        )}
      </SectionCard>
    </div>
  )
}

AnimauxIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default AnimauxIndex
```

- [ ] **Step 2: TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/frontend/pages/Backend/Animaux/Index.tsx
git commit -m "refactor: convert Animaux/Index to Tailwind + design tokens + ui components"
```

---

### Task 14: Travailleurs/Index.tsx

**Files:**
- Modify: `app/frontend/pages/Backend/Travailleurs/Index.tsx`

- [ ] **Step 1: Réécrire le fichier**

```tsx
// app/frontend/pages/Backend/Travailleurs/Index.tsx
import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { Plus, UserCog } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, StateBadge, Pagination, PrimaryButton, EmptyState } from '../../../components/ui'
import type { TravailleursIndexProps } from '../../../types/travailleur'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
}

const AVATAR_COLORS = [
  'var(--color-primary)', 'var(--color-warning)', 'var(--color-info)',
  '#7c3aed', 'var(--color-text-muted)', 'var(--color-danger)',
]

function TravailleursIndex({ travailleurs, meta }: TravailleursIndexProps) {
  const totalPages = Math.ceil(meta.total / meta.per_page)
  const active = travailleurs.filter(t => !t.dead_at).length

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Travailleurs"
        subtitle={`${meta.total} travailleur${meta.total !== 1 ? 's' : ''} · ${active} actif${active !== 1 ? 's' : ''}`}
        action={
          <PrimaryButton href="/backend/workers/new">
            <Plus size={14} /> Nouveau travailleur
          </PrimaryButton>
        }
      />

      {travailleurs.length === 0 ? (
        <EmptyState icon={UserCog} message="Aucun travailleur enregistré" />
      ) : (
        <div className="grid grid-cols-2 gap-3.5">
          {travailleurs.map((w, i) => {
            const isActive = !w.dead_at
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length]!
            return (
              <a
                key={w.id}
                href={`/backend/workers/${w.id}`}
                className="flex items-center gap-3.5 no-underline rounded-[var(--radius-card)] p-4"
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.transform = 'translateY(-1px)'
                  el.style.boxShadow = 'var(--shadow-elev)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = 'var(--shadow-card)'
                }}
              >
                <div className="relative shrink-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-[15px] font-bold"
                    style={{ background: `${color}1a`, color, fontFamily: 'var(--font-heading)' }}
                  >
                    {initials(w.name)}
                  </div>
                  {isActive && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                      style={{ background: 'var(--color-primary-light)', borderColor: 'var(--color-bg-card)' }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>{w.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {w.work_number || w.number || 'N° non défini'}
                    {w.born_at && ` · Né(e) le ${formatDate(w.born_at)}`}
                  </div>
                </div>
                <StateBadge
                  label={isActive ? 'Actif' : 'Inactif'}
                  color={isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                  bg={isActive ? 'var(--color-success-bg)' : 'var(--color-bg-subtle)'}
                />
              </a>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-2">
          <Pagination
            page={meta.page}
            totalPages={totalPages}
            total={meta.total}
            onPrev={() => router.visit(`/backend/workers?page=${meta.page - 1}`)}
            onNext={() => router.visit(`/backend/workers?page=${meta.page + 1}`)}
          />
        </div>
      )}
    </div>
  )
}

TravailleursIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default TravailleursIndex
```

- [ ] **Step 2: TypeScript check**

```bash
yarn tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/frontend/pages/Backend/Travailleurs/Index.tsx
git commit -m "refactor: convert Travailleurs/Index to Tailwind + design tokens + ui components"
```

---

### Task 15: Equipements/Index.tsx

**Files:**
- Modify: `app/frontend/pages/Backend/Equipements/Index.tsx`

- [ ] **Step 1: Réécrire le fichier**

```tsx
// app/frontend/pages/Backend/Equipements/Index.tsx
import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { Plus, Tractor } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, KpiCard, SectionCard, DataTable, StateBadge, Pagination, PrimaryButton } from '../../../components/ui'
import type { EquipementsIndexProps } from '../../../types/equipement'

function EquipementsIndex({ equipements, meta }: EquipementsIndexProps) {
  const totalPages = Math.ceil(meta.total / meta.per_page)
  const active = equipements.filter(e => !e.dead_at).length

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Équipements"
        subtitle={`${meta.total} équipement${meta.total !== 1 ? 's' : ''}`}
        action={
          <PrimaryButton href="/backend/equipments/new">
            <Plus size={14} /> Nouvel équipement
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <KpiCard icon={<Tractor size={16} />} label="Total"      value={meta.total} color="var(--color-info)" />
        <KpiCard icon={<Tractor size={16} />} label="En service" value={active}      color="var(--color-primary)" />
        <KpiCard icon={<Tractor size={16} />} label="Page"       value={`${meta.page}/${totalPages}`} color="var(--color-text-muted)" />
      </div>

      <SectionCard noPadding>
        <DataTable
          columns={[
            { key: 'name', label: 'Nom' },
            { key: 'number', label: 'N°' },
            { key: 'variety', label: 'Modèle / Variété' },
            { key: 'state', label: 'État' },
          ]}
          data={equipements}
          emptyMessage="Aucun équipement enregistré"
          renderRow={(e, i) => {
            const isActive = !e.dead_at
            return (
              <tr
                key={e.id}
                className="border-b"
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)',
                  borderColor: 'var(--color-border)',
                }}
                onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.background = 'var(--color-bg-highlight)' }}
                onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)' }}
              >
                <td className="px-3.5 py-2.5 text-sm">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}
                    >
                      <Tractor size={13} />
                    </span>
                    <a href={`/backend/equipments/${e.id}`} className="font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>
                      {e.name}
                    </a>
                  </div>
                </td>
                <td className="px-3.5 py-2.5 text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{e.number || '—'}</td>
                <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{e.variety || '—'}</td>
                <td className="px-3.5 py-2.5">
                  <StateBadge
                    label={isActive ? 'En service' : 'Inactif'}
                    color={isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                    bg={isActive ? 'var(--color-success-bg)' : 'var(--color-bg-subtle)'}
                  />
                </td>
              </tr>
            )
          }}
        />
        {totalPages > 1 && (
          <Pagination
            page={meta.page}
            totalPages={totalPages}
            total={meta.total}
            onPrev={() => router.visit(`/backend/equipments?page=${meta.page - 1}`)}
            onNext={() => router.visit(`/backend/equipments?page=${meta.page + 1}`)}
          />
        )}
      </SectionCard>
    </div>
  )
}

EquipementsIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default EquipementsIndex
```

- [ ] **Step 2: TypeScript check + commit**

```bash
yarn tsc --noEmit
git add app/frontend/pages/Backend/Equipements/Index.tsx
git commit -m "refactor: convert Equipements/Index to Tailwind + design tokens + ui components"
```

---

### Task 16: Entites/Index.tsx

**Files:**
- Modify: `app/frontend/pages/Backend/Entites/Index.tsx`

- [ ] **Step 1: Réécrire le fichier**

```tsx
// app/frontend/pages/Backend/Entites/Index.tsx
import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { Plus, Search, Building2, User, ChevronRight } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, SectionCard, StateBadge, Pagination, PrimaryButton, FilterBar } from '../../../components/ui'
import type { EntitesIndexProps } from '../../../types/entite'

function EntitesIndex({ entites, meta, filters }: EntitesIndexProps) {
  const totalPages = Math.ceil(meta.total / meta.per_page)

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value
    router.get('/backend/entities', { q }, { preserveState: true })
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Entités"
        subtitle={`${meta.total} entité${meta.total !== 1 ? 's' : ''}`}
        action={
          <PrimaryButton href="/backend/entities/new">
            <Plus size={14} /> Nouvelle entité
          </PrimaryButton>
        }
      />

      <FilterBar>
        <form onSubmit={handleSearch} className="flex gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
            <input
              name="q"
              type="text"
              defaultValue={filters.q ?? ''}
              placeholder="Rechercher par nom…"
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
              }}
            />
          </div>
          <PrimaryButton type="submit" variant="primary" size="sm">Chercher</PrimaryButton>
        </form>
      </FilterBar>

      <SectionCard noPadding>
        <ul className="list-none m-0 p-0">
          {entites.length === 0 && (
            <li className="p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Aucune entité trouvée
            </li>
          )}
          {entites.map((entite, idx) => {
            const isOrg = entite.nature === 'organization'
            const isActive = !entite.dead_at
            return (
              <li
                key={entite.id}
                className="flex items-center gap-3 px-4 py-3 border-b"
                style={{ borderColor: idx < entites.length - 1 ? 'var(--color-border)' : 'transparent' }}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: isOrg ? 'var(--color-info-bg)' : 'var(--color-warning-bg)',
                    color: isOrg ? 'var(--color-info)' : 'var(--color-warning)',
                  }}
                >
                  {isOrg ? <Building2 size={15} /> : <User size={15} />}
                </span>
                <div className="flex-1 min-w-0">
                  <a href={`/backend/entities/${entite.id}`} className="text-sm font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>
                    {entite.full_name}
                  </a>
                  {entite.number && (
                    <div className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      {entite.number}
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {entite.is_client && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>Client</span>
                  )}
                  {entite.is_supplier && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' }}>Fournisseur</span>
                  )}
                </div>
                <StateBadge
                  label={isActive ? 'Actif' : 'Inactif'}
                  color={isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                  bg={isActive ? 'var(--color-success-bg)' : 'var(--color-bg-subtle)'}
                />
                <a href={`/backend/entities/${entite.id}`} className="shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                  <ChevronRight size={14} />
                </a>
              </li>
            )
          })}
        </ul>
        {totalPages > 1 && (
          <Pagination
            page={meta.page}
            totalPages={totalPages}
            total={meta.total}
            onPrev={() => router.visit(`/backend/entities?page=${meta.page - 1}`)}
            onNext={() => router.visit(`/backend/entities?page=${meta.page + 1}`)}
          />
        )}
      </SectionCard>
    </div>
  )
}

EntitesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default EntitesIndex
```

- [ ] **Step 2: TypeScript check + commit**

```bash
yarn tsc --noEmit
git add app/frontend/pages/Backend/Entites/Index.tsx
git commit -m "refactor: convert Entites/Index to Tailwind + design tokens + ui components"
```

---

### Task 17: Campagnes/Index.tsx + Activites/Index.tsx

**Files:**
- Modify: `app/frontend/pages/Backend/Campagnes/Index.tsx`
- Modify: `app/frontend/pages/Backend/Activites/Index.tsx`

- [ ] **Step 1: Réécrire Campagnes/Index.tsx**

```tsx
// app/frontend/pages/Backend/Campagnes/Index.tsx
import type { ReactNode } from 'react'
import { Plus, Calendar } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, KpiCard, StateBadge, ProgressBar, PrimaryButton } from '../../../components/ui'
import type { CampagnesIndexProps } from '../../../types/campagne'

function CampagnesIndex({ campagnes, meta }: CampagnesIndexProps) {
  const enCours = campagnes.filter(c => !c.closed).length
  const cloturees = campagnes.filter(c => c.closed).length

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Campagnes"
        subtitle={`${meta.total} campagne${meta.total !== 1 ? 's' : ''}`}
        action={
          <PrimaryButton href="/backend/campaigns/new">
            <Plus size={14} /> Nouvelle campagne
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <KpiCard icon={<Calendar size={16} />} label="Total"     value={meta.total} color="var(--color-info)" />
        <KpiCard icon={<Calendar size={16} />} label="En cours"  value={enCours}    color="var(--color-primary)" />
        <KpiCard icon={<Calendar size={16} />} label="Clôturées" value={cloturees}  color="var(--color-text-muted)" />
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        {campagnes.map(c => (
          <a
            key={c.id}
            href={`/backend/campaigns/${c.id}`}
            className="no-underline rounded-[var(--radius-card)] p-4 block"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.transform = 'translateY(-1px)'
              el.style.boxShadow = 'var(--shadow-elev)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = 'var(--shadow-card)'
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
                {c.name}
              </span>
              <StateBadge
                label={c.closed ? 'Clôturée' : 'En cours'}
                color={c.closed ? 'var(--color-danger)' : 'var(--color-primary)'}
                bg={c.closed ? 'var(--color-danger-bg)' : 'var(--color-success-bg)'}
              />
            </div>
            {c.harvest_year && (
              <div className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Récolte {c.harvest_year}
              </div>
            )}
            <ProgressBar
              value={c.closed ? 1 : 0}
              max={1}
              fillColor={c.closed ? 'var(--color-text-muted)' : 'var(--color-primary)'}
              label={c.closed ? '100%' : 'En cours'}
            />
          </a>
        ))}
      </div>
    </div>
  )
}

CampagnesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default CampagnesIndex
```

- [ ] **Step 2: Réécrire Activites/Index.tsx**

```tsx
// app/frontend/pages/Backend/Activites/Index.tsx
import type { ReactNode } from 'react'
import { useState, useMemo } from 'react'
import { Plus, Sprout, PawPrint, Grape, Wrench, Star } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, SectionCard, DataTable, StateBadge, PrimaryButton, FilterBar } from '../../../components/ui'
import type { ActivitesIndexProps, Activite } from '../../../types/activite'

type Family = 'vine_farming' | 'animal_farming' | 'crop_farming' | 'equipment_maintenance' | string

const FAMILY_CFG: Record<string, { label: string; color: string; bg: string; Icon: typeof Sprout }> = {
  vine_farming:          { label: 'Viticulture',   color: '#7c3aed', bg: '#ede9fe',             Icon: Grape },
  animal_farming:        { label: 'Élevage',       color: 'var(--color-warning)',  bg: 'var(--color-warning-bg)', Icon: PawPrint },
  crop_farming:          { label: 'Culture',       color: 'var(--color-primary)',  bg: 'var(--color-success-bg)', Icon: Sprout },
  equipment_maintenance: { label: 'Maintenance',   color: 'var(--color-info)',     bg: 'var(--color-info-bg)',    Icon: Wrench },
}

function getFamilyCfg(family: string) {
  return FAMILY_CFG[family] ?? { label: family, color: 'var(--color-text-muted)', bg: 'var(--color-bg-subtle)', Icon: Star }
}

function ActivitesIndex({ activites, meta }: ActivitesIndexProps) {
  const [familyFilter, setFamilyFilter] = useState<Family | ''>('')
  const families = useMemo(() => [...new Set(activites.map(a => a.family))], [activites])

  const visible = familyFilter ? activites.filter(a => a.family === familyFilter) : activites

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Activités"
        subtitle={`${meta.total} activité${meta.total !== 1 ? 's' : ''}`}
        action={
          <PrimaryButton href="/backend/activities/new">
            <Plus size={14} /> Nouvelle activité
          </PrimaryButton>
        }
      />

      <FilterBar>
        <div className="flex gap-1.5 flex-wrap">
          {(['', ...families] as (Family | '')[]).map(f => {
            const cfg = f ? getFamilyCfg(f) : null
            const active = familyFilter === f
            return (
              <button
                key={f || '_all'}
                type="button"
                onClick={() => setFamilyFilter(f)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer"
                style={{
                  background: active ? (cfg?.bg ?? 'var(--color-bg-highlight)') : 'var(--color-bg)',
                  borderColor: active ? (cfg?.color ?? 'var(--color-primary)') + '55' : 'var(--color-border)',
                  color: active ? (cfg?.color ?? 'var(--color-primary)') : 'var(--color-text-muted)',
                }}
              >
                {f ? getFamilyCfg(f).label : 'Toutes'}
              </button>
            )
          })}
        </div>
      </FilterBar>

      <SectionCard noPadding>
        <DataTable
          columns={[
            { key: 'name', label: 'Activité' },
            { key: 'family', label: 'Famille' },
            { key: 'production_system', label: 'Système' },
            { key: 'state', label: 'État' },
          ]}
          data={visible}
          emptyMessage="Aucune activité enregistrée"
          renderRow={(a: Activite, i) => {
            const cfg = getFamilyCfg(a.family)
            const { Icon } = cfg
            return (
              <tr
                key={a.id}
                className="border-b"
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)',
                  borderColor: 'var(--color-border)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-highlight)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)' }}
              >
                <td className="px-3.5 py-2.5 text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon size={13} />
                    </span>
                    <a href={`/backend/activities/${a.id}`} className="font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>
                      {a.name}
                    </a>
                  </div>
                </td>
                <td className="px-3.5 py-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </td>
                <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{a.production_system || '—'}</td>
                <td className="px-3.5 py-2.5">
                  <StateBadge
                    label={a.suspended ? 'Suspendue' : 'Active'}
                    color={a.suspended ? 'var(--color-danger)' : 'var(--color-primary)'}
                    bg={a.suspended ? 'var(--color-danger-bg)' : 'var(--color-success-bg)'}
                  />
                </td>
              </tr>
            )
          }}
        />
      </SectionCard>
    </div>
  )
}

ActivitesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default ActivitesIndex
```

- [ ] **Step 3: TypeScript check + commit**

```bash
yarn tsc --noEmit
git add app/frontend/pages/Backend/Campagnes/Index.tsx app/frontend/pages/Backend/Activites/Index.tsx
git commit -m "refactor: convert Campagnes/Index and Activites/Index to Tailwind + ui components"
```

---

### Task 18: Budgets/Index.tsx + Alertes/Index.tsx

**Files:**
- Modify: `app/frontend/pages/Backend/Budgets/Index.tsx`
- Modify: `app/frontend/pages/Backend/Alertes/Index.tsx`

- [ ] **Step 1: Réécrire Budgets/Index.tsx**

```tsx
// app/frontend/pages/Backend/Budgets/Index.tsx
import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Plus, Wallet, ShoppingBag, Package, Trash2, Edit } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, KpiCard, SectionCard, EmptyState, ProgressBar, CodeBadge, Pagination, PrimaryButton } from '../../../components/ui'
import type { BudgetsIndexProps } from '../../../types/budget'

function BudgetsIndex({ budgets, meta }: BudgetsIndexProps) {
  const totalPages = Math.ceil(meta.total / meta.per_page)
  const totalPurchases = budgets.reduce((s, b) => s + b.purchase_items_count, 0)
  const totalReceptions = budgets.reduce((s, b) => s + b.reception_items_count, 0)

  function handleDelete(id: number, name: string) {
    if (!window.confirm(`Supprimer le budget "${name}" ?`)) return
    router.delete(`/backend/project_budgets/${id}`)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Budgets projet"
        subtitle={`${meta.total} budget${meta.total !== 1 ? 's' : ''}`}
        action={
          <PrimaryButton href="/backend/project_budgets/new">
            <Plus size={14} /> Nouveau budget
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <KpiCard icon={<Wallet size={16} />}      label="Total budgets"    value={meta.total}       color="var(--color-primary)" />
        <KpiCard icon={<ShoppingBag size={16} />} label="Lignes achats"    value={totalPurchases}   color="var(--color-warning)" />
        <KpiCard icon={<Package size={16} />}     label="Lignes réceptions" value={totalReceptions} color="var(--color-info)" />
      </div>

      {budgets.length === 0 ? (
        <SectionCard>
          <EmptyState icon={Wallet} message="Aucun budget projet enregistré" />
        </SectionCard>
      ) : (
        <SectionCard noPadding>
          <ul className="list-none m-0 p-0">
            {budgets.map((budget, idx) => (
              <li
                key={budget.id}
                className="flex items-center gap-4 px-4 py-4 border-b"
                style={{ borderColor: idx < budgets.length - 1 ? 'var(--color-border)' : 'transparent' }}
              >
                <span
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: 'var(--color-bg-highlight)', color: 'var(--color-primary)' }}
                >
                  <Wallet size={18} />
                </span>

                <div className="flex-1 min-w-0">
                  <a href={`/backend/project_budgets/${budget.id}`} className="text-sm font-bold no-underline" style={{ color: 'var(--color-primary)' }}>
                    {budget.name}
                  </a>
                  {budget.description && (
                    <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {budget.description}
                    </div>
                  )}
                  {budget.purchase_items_count > 0 && (
                    <ProgressBar
                      value={budget.reception_items_count}
                      max={budget.purchase_items_count}
                      label={`${budget.reception_items_count}/${budget.purchase_items_count} reçus`}
                    />
                  )}
                </div>

                {budget.isacompta_analytic_code ? (
                  <CodeBadge value={budget.isacompta_analytic_code} />
                ) : (
                  <CodeBadge value="Code manquant" variant="warning" />
                )}

                <div className="flex gap-3 shrink-0 text-center">
                  {[
                    { n: budget.purchase_items_count, l: 'Achats' },
                    { n: budget.reception_items_count, l: 'Réceptions' },
                  ].map(({ n, l }) => (
                    <div key={l}>
                      <div className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>{n}</div>
                      <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{l}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-1.5 items-center shrink-0">
                  <a href={`/backend/project_budgets/${budget.id}/edit`} title="Modifier" style={{ color: 'var(--color-text-muted)' }}>
                    <Edit size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(budget.id, budget.name)}
                    title="Supprimer"
                    className="bg-transparent border-none cursor-pointer p-0"
                    style={{ color: 'var(--color-danger)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <Pagination
              page={meta.page}
              totalPages={totalPages}
              total={meta.total}
              onPrev={() => router.visit(`/backend/project_budgets?page=${meta.page - 1}`)}
              onNext={() => router.visit(`/backend/project_budgets?page=${meta.page + 1}`)}
            />
          )}
        </SectionCard>
      )}
    </div>
  )
}

BudgetsIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default BudgetsIndex
```

- [ ] **Step 2: Réécrire Alertes/Index.tsx**

```tsx
// app/frontend/pages/Backend/Alertes/Index.tsx
import type { ReactNode } from 'react'
import { useState } from 'react'
import { CheckCircle, Plus, AlertTriangle, Clock, UserX, PawPrint, ChevronRight } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, SectionCard, StateBadge, PrimaryButton } from '../../../components/ui'
import type { AlertesIndexProps } from '../../../types/alerte'
import type { IssueItem } from '../../../types/issue'
import { ISSUE_NATURE_LABELS } from '../../../types/issue'

const TYPE_CFG = {
  intervention_overdue: { label: 'Retard',  color: 'var(--color-warning-text)', bg: 'var(--color-warning-bg)', border: '#fcd34d', Icon: Clock,    sectionTitle: 'Interventions en retard' },
  animal_dead:          { label: 'Décès',   color: 'var(--color-danger-text)',   bg: 'var(--color-danger-bg)',  border: 'var(--color-danger-border)', Icon: PawPrint, sectionTitle: 'Animaux récemment décédés' },
  worker_departed:      { label: 'Départ',  color: '#5b21b6',                   bg: '#ede9fe',                 border: '#c4b5fd', Icon: UserX,    sectionTitle: 'Travailleurs récemment partis' },
} as const

type AlertType = keyof typeof TYPE_CFG

const ALERT_ORDER: AlertType[] = ['intervention_overdue', 'animal_dead', 'worker_departed']

const SEVERITY_COLOR: Record<string, string> = {
  high:   'var(--color-danger)',
  medium: 'var(--color-warning)',
  low:    'var(--color-text-muted)',
}

function gravityColor(gravity: number): string {
  if (gravity >= 5) return 'var(--color-danger)'
  if (gravity === 4) return 'var(--color-danger)'
  if (gravity === 3) return 'var(--color-warning)'
  return 'var(--color-text-muted)'
}

function AlertesIndex({ alertes, counts, issues }: AlertesIndexProps) {
  const [activeType, setActiveType] = useState<AlertType | null>(null)
  const totalAlerts = alertes.length
  const visibleAlerts = activeType ? alertes.filter(a => a.type === activeType) : alertes

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Alertes"
        subtitle={`${totalAlerts} alerte${totalAlerts !== 1 ? 's' : ''} active${totalAlerts !== 1 ? 's' : ''}`}
        action={
          <PrimaryButton href="/backend/issues/new">
            <Plus size={14} /> Signaler un problème
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-3 gap-3.5 mb-5">
        {ALERT_ORDER.map(type => {
          const cfg = TYPE_CFG[type]
          const count = counts[type as keyof typeof counts]
          const active = activeType === type
          const { Icon } = cfg
          return (
            <button
              key={type}
              onClick={() => setActiveType(active ? null : type)}
              className="flex items-center gap-3.5 rounded-[var(--radius-card)] p-4 border text-left w-full cursor-pointer"
              style={{
                background: active ? cfg.bg : 'var(--color-bg-card)',
                borderColor: active ? cfg.border : 'var(--color-border)',
                boxShadow: active ? `0 2px 8px ${cfg.color}22` : 'var(--shadow-card)',
                transition: 'all 0.15s',
              }}
            >
              <span
                className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: `${cfg.color}1a`, color: cfg.color }}
              >
                <Icon size={18} />
              </span>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: active ? cfg.color : 'var(--color-text-muted)' }}>
                  {cfg.sectionTitle}
                </div>
                <div className="text-[24px] font-bold leading-tight" style={{ fontFamily: 'var(--font-heading)', color: active ? cfg.color : 'var(--color-text)' }}>
                  {count}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {alertes.length === 0 ? (
        <SectionCard>
          <div className="flex flex-col items-center gap-3 py-12">
            <CheckCircle size={40} style={{ color: 'var(--color-primary)' }} />
            <p className="text-sm font-semibold m-0" style={{ color: 'var(--color-primary)' }}>Aucune alerte — tout va bien !</p>
          </div>
        </SectionCard>
      ) : (
        <>
          <SectionCard noPadding className="mb-4">
            <div className="px-4 py-3.5 flex items-center justify-between border-b" style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                {activeType ? TYPE_CFG[activeType]?.sectionTitle : 'Toutes les alertes'}
              </span>
              {activeType && (
                <button onClick={() => setActiveType(null)} className="text-[11px] font-semibold bg-transparent border-none cursor-pointer" style={{ color: 'var(--color-primary)' }}>
                  Tout afficher
                </button>
              )}
            </div>
            <ul className="list-none m-0 p-0">
              {visibleAlerts.map((alerte, idx) => {
                const cfg = TYPE_CFG[alerte.type as AlertType] ?? TYPE_CFG['intervention_overdue']
                const { Icon } = cfg
                return (
                  <li
                    key={alerte.id}
                    className="flex items-center gap-3 px-4 py-3 border-b"
                    style={{ borderColor: idx < visibleAlerts.length - 1 ? 'var(--color-border)' : 'transparent' }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SEVERITY_COLOR[alerte.severity] ?? 'var(--color-text-muted)' }} />
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon size={13} />
                    </span>
                    <StateBadge label={cfg.label} color={cfg.color} bg={cfg.bg} border={cfg.border} dot={false} />
                    <a href={alerte.href} className="flex-1 font-semibold no-underline text-sm min-w-0 truncate" style={{ color: 'var(--color-text)' }}>
                      {alerte.label}
                    </a>
                    <span className="text-xs whitespace-nowrap shrink-0" style={{ color: 'var(--color-text-muted)' }}>{alerte.detail}</span>
                    <a href={alerte.href} className="shrink-0" style={{ color: 'var(--color-text-muted)' }}><ChevronRight size={14} /></a>
                  </li>
                )
              })}
            </ul>
          </SectionCard>

          {issues.length > 0 && (
            <SectionCard noPadding>
              <div className="px-4 py-3.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Problèmes signalés</span>
              </div>
              <ul className="list-none m-0 p-0">
                {issues.map((issue: IssueItem, idx) => (
                  <li key={issue.id} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: idx < issues.length - 1 ? 'var(--color-border)' : 'transparent' }}>
                    <span className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: gravityColor(issue.gravity), color: '#fff' }}>
                      {issue.gravity}
                    </span>
                    <a href={`/backend/issues/${issue.id}`} className="flex-1 font-semibold no-underline text-sm" style={{ color: 'var(--color-text)' }}>
                      {issue.name}
                    </a>
                    <span className="text-xs whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                      {ISSUE_NATURE_LABELS[issue.nature] ?? issue.nature}
                      {issue.observed_at ? ` · ${issue.observed_at}` : ''}
                    </span>
                    <a href={`/backend/issues/${issue.id}`} className="shrink-0" style={{ color: 'var(--color-text-muted)' }}><ChevronRight size={14} /></a>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </>
      )}
    </div>
  )
}

AlertesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default AlertesIndex
```

- [ ] **Step 3: TypeScript check + commit**

```bash
yarn tsc --noEmit
git add app/frontend/pages/Backend/Budgets/Index.tsx app/frontend/pages/Backend/Alertes/Index.tsx
git commit -m "refactor: convert Budgets/Index and Alertes/Index to Tailwind + ui components"
```

---

### Task 19: Catalogue/Index.tsx + Productions/Index.tsx

**Files:**
- Modify: `app/frontend/pages/Backend/Catalogue/Index.tsx`
- Modify: `app/frontend/pages/Backend/Productions/Index.tsx`

- [ ] **Step 1: Réécrire Catalogue/Index.tsx**

```tsx
// app/frontend/pages/Backend/Catalogue/Index.tsx
import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Download, Plus, Search, Package, PawPrint, Tractor, Sprout, Box } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, SectionCard, DataTable, StateBadge, Pagination, PrimaryButton, FilterBar } from '../../../components/ui'
import type { CatalogueIndexProps, ProduitType } from '../../../types/catalogue'

const TYPE_CFG: Record<ProduitType, { label: string; color: string; bg: string; Icon: typeof Package }> = {
  Matter:    { label: 'Matière',    color: 'var(--color-primary)',  bg: 'var(--color-success-bg)', Icon: Package },
  Animal:    { label: 'Animal',     color: 'var(--color-warning)',  bg: 'var(--color-warning-bg)', Icon: PawPrint },
  Equipment: { label: 'Équipement', color: 'var(--color-info)',     bg: 'var(--color-info-bg)',    Icon: Tractor },
  Plant:     { label: 'Plante',     color: '#7c3aed',               bg: '#ede9fe',                 Icon: Sprout },
  Other:     { label: 'Autre',      color: 'var(--color-text-muted)', bg: 'var(--color-bg-subtle)', Icon: Box },
}

const TYPE_FILTERS: { value: ProduitType | ''; label: string }[] = [
  { value: '', label: 'Tous' }, { value: 'Matter', label: 'Matière' },
  { value: 'Animal', label: 'Animal' }, { value: 'Equipment', label: 'Équipement' },
  { value: 'Plant', label: 'Plante' }, { value: 'Other', label: 'Autre' },
]

export default function CatalogueIndex({ produits, filters, meta }: CatalogueIndexProps) {
  const [q, setQ] = useState(filters.q ?? '')
  const [typeFilter, setTypeFilter] = useState<ProduitType | ''>(filters.produit_type ?? '')
  const [etatFilter, setEtatFilter] = useState<'alive' | 'dead' | ''>(filters.etat ?? '')

  function search() {
    router.get('/backend/products', { q, produit_type: typeFilter, etat: etatFilter }, { preserveState: true })
  }

  const csvHref = `/backend/products.csv?${new URLSearchParams(
    Object.fromEntries(Object.entries({ q, produit_type: typeFilter, etat: etatFilter }).filter(([, v]) => v !== ''))
  )}`

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Catalogue"
        subtitle={`${meta.total_count} produit${meta.total_count !== 1 ? 's' : ''}`}
        action={
          <div className="flex gap-2">
            <a href={csvHref} download className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold no-underline border"
              style={{ background: 'var(--color-bg-card)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
              <Download size={14} /> CSV
            </a>
            <PrimaryButton href="/backend/products/new"><Plus size={14} /> Nouveau produit</PrimaryButton>
          </div>
        }
      />

      <FilterBar>
        <div className="relative flex-1 min-w-0" style={{ minWidth: 200 }}>
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Rechercher par nom…"
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_FILTERS.map(f => {
            const cfg = f.value ? TYPE_CFG[f.value] : null
            const active = typeFilter === f.value
            return (
              <button key={f.value || '_all'} type="button" onClick={() => { setTypeFilter(f.value); search() }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer"
                style={{
                  background: active ? (cfg?.bg ?? 'var(--color-bg-highlight)') : 'var(--color-bg)',
                  borderColor: active ? `${cfg?.color ?? 'var(--color-primary)'}55` : 'var(--color-border)',
                  color: active ? (cfg?.color ?? 'var(--color-primary)') : 'var(--color-text-muted)',
                }}>
                {f.label}
              </button>
            )
          })}
        </div>
        <select value={etatFilter} onChange={e => { setEtatFilter(e.target.value as 'alive' | 'dead' | ''); search() }}
          className="px-2.5 py-1.5 text-sm rounded-lg border cursor-pointer"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
          <option value="">Tous états</option>
          <option value="alive">Vivant / Actif</option>
          <option value="dead">Inactif</option>
        </select>
        <button type="button" onClick={search} className="px-3.5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer border-none"
          style={{ background: 'var(--color-primary)', color: '#fff' }}>
          Chercher
        </button>
      </FilterBar>

      <SectionCard noPadding>
        <DataTable
          columns={[
            { key: 'name', label: 'Nom' }, { key: 'type', label: 'Type' },
            { key: 'number', label: 'N°' }, { key: 'stock', label: 'Stock' },
            { key: 'unit', label: 'Unité' }, { key: 'state', label: 'État' },
          ]}
          data={produits}
          emptyMessage="Aucun produit trouvé"
          renderRow={(p, i) => {
            const cfg = TYPE_CFG[p.produit_type]
            const { Icon } = cfg
            const isLow = p.population === 0
            const isInactive = !!p.dead_at
            return (
              <tr key={p.id} className="border-b"
                style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)', borderColor: 'var(--color-border)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-highlight)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)' }}>
                <td className="px-3.5 py-2.5 text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon size={13} />
                    </span>
                    <a href={`/backend/products/${p.id}`} className="font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>{p.name}</a>
                  </div>
                </td>
                <td className="px-3.5 py-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                </td>
                <td className="px-3.5 py-2.5 text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{p.number}</td>
                <td className="px-3.5 py-2.5 text-sm font-semibold tabular-nums" style={{ color: isLow ? 'var(--color-danger)' : 'var(--color-text)' }}>{p.population}</td>
                <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{p.unit_name}</td>
                <td className="px-3.5 py-2.5">
                  {isInactive
                    ? <StateBadge label="Inactif"  color="var(--color-text-muted)" bg="var(--color-bg-subtle)" />
                    : isLow
                      ? <StateBadge label="Épuisé"   color="var(--color-danger)"     bg="var(--color-danger-bg)" />
                      : <StateBadge label="En stock" color="var(--color-primary)"    bg="var(--color-success-bg)" />
                  }
                </td>
              </tr>
            )
          }}
        />
        {meta.total_pages > 1 && (
          <Pagination
            page={meta.current_page}
            totalPages={meta.total_pages}
            total={meta.total_count}
            onPrev={() => router.get('/backend/products', { q, produit_type: typeFilter, etat: etatFilter, page: meta.current_page - 1 })}
            onNext={() => router.get('/backend/products', { q, produit_type: typeFilter, etat: etatFilter, page: meta.current_page + 1 })}
          />
        )}
      </SectionCard>
    </div>
  )
}

CatalogueIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

- [ ] **Step 2: Réécrire Productions/Index.tsx** — conserver GanttView

```tsx
// app/frontend/pages/Backend/Productions/Index.tsx
import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Plus, Sprout, Activity, CheckCircle, List, BarChart2 } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, KpiCard, SectionCard, DataTable, StateBadge, ProgressBar, Pagination, PrimaryButton, ViewToggle } from '../../../components/ui'
import { GanttView } from '../../../components/productions/GanttView'
import type { ProductionsIndexProps, Production } from '../../../types/production'

const STATE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  opened:  { label: 'En cours',   color: 'var(--color-primary)',  bg: 'var(--color-success-bg)' },
  closed:  { label: 'Terminée',   color: 'var(--color-text-muted)', bg: 'var(--color-bg-subtle)' },
  aborted: { label: 'Abandonnée', color: 'var(--color-danger)',   bg: 'var(--color-danger-bg)' },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ProductionsIndex({ productions, meta }: ProductionsIndexProps) {
  const [view, setView] = useState<'list' | 'gantt'>('list')
  const totalPages = Math.ceil(meta.total / meta.per_page)
  const enCours = productions.filter(p => p.state === 'opened').length
  const terminees = productions.filter(p => p.state === 'closed').length

  const families = [...new Set(productions.map(p => p.activity_family).filter(Boolean))]

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="flex justify-between items-start mb-5 gap-4">
        <div>
          <h1 className="text-[26px] font-bold m-0 leading-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            Productions
          </h1>
          <p className="mt-1 text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
            {meta.total} production{meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ViewToggle
            views={[
              { key: 'list', label: 'Liste', icon: List },
              { key: 'gantt', label: 'Gantt', icon: BarChart2 },
            ]}
            active={view}
            onChange={(k) => setView(k as 'list' | 'gantt')}
          />
          <PrimaryButton href="/backend/activity_productions/new">
            <Plus size={14} /> Nouvelle production
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <KpiCard icon={<Sprout size={16} />}      label="Total"    value={meta.total} color="var(--color-primary)" />
        <KpiCard icon={<Activity size={16} />}     label="En cours" value={enCours}   color="var(--color-warning)" />
        <KpiCard icon={<CheckCircle size={16} />}  label="Terminées" value={terminees} color="var(--color-info)" />
        <KpiCard icon={<Sprout size={16} />}       label="Familles" value={families.length} color="var(--color-text-muted)" />
      </div>

      {view === 'gantt' ? (
        <SectionCard noPadding>
          <GanttView productions={productions} />
        </SectionCard>
      ) : (
        <SectionCard noPadding>
          <DataTable
            columns={[
              { key: 'name', label: 'Production' },
              { key: 'activity', label: 'Activité' },
              { key: 'dates', label: 'Période' },
              { key: 'progress', label: 'Avancement' },
              { key: 'state', label: 'État' },
            ]}
            data={productions}
            emptyMessage="Aucune production enregistrée"
            renderRow={(p: Production, i) => {
              const s = STATE_CONFIG[p.state] ?? { label: p.state, color: 'var(--color-text-muted)', bg: 'var(--color-bg-subtle)' }
              return (
                <tr key={p.id} className="border-b"
                  style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)', borderColor: 'var(--color-border)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-highlight)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)' }}>
                  <td className="px-3.5 py-2.5 text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--color-success-bg)', color: 'var(--color-primary)' }}>
                        <Sprout size={13} />
                      </span>
                      <a href={`/backend/activity_productions/${p.id}`} className="font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>{p.name}</a>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{p.activity_name || '—'}</td>
                  <td className="px-3.5 py-2.5 text-xs whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                    {formatDate(p.started_on)} → {formatDate(p.stopped_on)}
                  </td>
                  <td className="px-3.5 py-2.5" style={{ minWidth: 120 }}>
                    <ProgressBar value={p.interventions_count ?? 0} max={Math.max(p.interventions_count ?? 0, 1)} />
                  </td>
                  <td className="px-3.5 py-2.5">
                    <StateBadge label={s.label} color={s.color} bg={s.bg} />
                  </td>
                </tr>
              )
            }}
          />
          {totalPages > 1 && (
            <Pagination
              page={meta.page}
              totalPages={totalPages}
              total={meta.total}
              onPrev={() => router.visit(`/backend/activity_productions?page=${meta.page - 1}`)}
              onNext={() => router.visit(`/backend/activity_productions?page=${meta.page + 1}`)}
            />
          )}
        </SectionCard>
      )}
    </div>
  )
}

ProductionsIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default ProductionsIndex
```

- [ ] **Step 3: TypeScript check + commit**

```bash
yarn tsc --noEmit
git add app/frontend/pages/Backend/Catalogue/Index.tsx app/frontend/pages/Backend/Productions/Index.tsx
git commit -m "refactor: convert Catalogue/Index and Productions/Index to Tailwind + ui components"
```

---

### Task 20: Ventes/Index.tsx + Achats/CommandesIndex.tsx + Achats/FacturesIndex.tsx

**Files:**
- Modify: `app/frontend/pages/Backend/Ventes/Index.tsx`
- Modify: `app/frontend/pages/Backend/Achats/CommandesIndex.tsx`
- Modify: `app/frontend/pages/Backend/Achats/FacturesIndex.tsx`

- [ ] **Step 1: Mettre à jour Ventes/Index.tsx**

Ouvrir `app/frontend/pages/Backend/Ventes/Index.tsx`. Les principaux changements :

1. Remplacer le bloc `<div style={{ display: 'flex', justifyContent: 'space-between'...}}>` du titre par `<PageHeader>`.
2. Remplacer le bloc filter bar `<div style={{ background: 'var(--color-bg-card)'...}}>` par `<FilterBar>`.
3. Remplacer la `<table>` existante par `<SectionCard noPadding><DataTable ...>`.
4. Remplacer les `<div style={{... borderTop ...}}>` de pagination par `<Pagination>`.
5. Remplacer le StateBadge inline par `<StateBadge>`.
6. Remplacer toutes les instances `#1B6B3A` par `var(--color-primary)`, `#fee2e2` par `var(--color-danger-bg)`, etc.

Ajouter en haut du fichier :
```tsx
import { PageHeader, SectionCard, DataTable, StateBadge, Pagination, PrimaryButton, FilterBar } from '../../../components/ui'
```

Remplacer le bouton "Nouvelle vente" :
```tsx
// Avant
<a href="..." style={{ background: 'linear-gradient(180deg, #1B6B3A...)' ... }}>
// Après
<PrimaryButton href={natures.length === 1 ? `/backend/sales/new?sale[nature_id]=${natures[0]!.id}` : '/backend/sales/new'}>
  <Plus size={14} /> Nouvelle vente
</PrimaryButton>
```

Remplacer `STATE_CONFIG` couleurs :
```tsx
const STATE_CONFIG: Record<VenteState, { label: string; color: string; bg: string; border: string }> = {
  draft:    { label: 'Brouillon', color: 'var(--color-text-muted)', bg: 'var(--color-bg-subtle)',  border: 'var(--color-border)' },
  estimate: { label: 'Devis',     color: 'var(--color-info)',       bg: 'var(--color-info-bg)',    border: 'var(--color-info)55' },
  aborted:  { label: 'Annulé',    color: 'var(--color-danger)',     bg: 'var(--color-danger-bg)',  border: 'var(--color-danger)55' },
  refused:  { label: 'Refusé',    color: 'var(--color-warning-text)', bg: 'var(--color-warning-bg)', border: 'var(--color-warning)55' },
  order:    { label: 'Commande',  color: 'var(--color-warning)',    bg: 'var(--color-warning-bg)', border: 'var(--color-warning)55' },
  invoice:  { label: 'Facture',   color: 'var(--color-primary)',    bg: 'var(--color-success-bg)', border: 'var(--color-primary)55' },
}
```

Remplacer le tableau `<table>` par `<DataTable>` avec les mêmes colonnes.

- [ ] **Step 2: Mettre à jour CommandesIndex.tsx + FacturesIndex.tsx**

Même approche que Ventes/Index :
1. Ajouter l'import des composants ui.
2. Remplacer `<AchatsTabs>` (conserver l'import existant — AchatsTabs reste pour la navigation).
3. Remplacer les couleurs `STATE_CONFIG` par les vars tokens.
4. Remplacer le tableau et la pagination par `<DataTable>` + `<Pagination>`.
5. Remplacer les hexcodes directs par `var(--color-*)`.

Pour `CommandesIndex.tsx`, le STATE_CONFIG commandes :
```tsx
const STATE_CONFIG = {
  draft:     { label: 'Brouillon',  color: 'var(--color-text-muted)', bg: 'var(--color-bg-subtle)' },
  estimate:  { label: 'Devis',      color: 'var(--color-info)',       bg: 'var(--color-info-bg)' },
  order:     { label: 'Commande',   color: 'var(--color-warning)',    bg: 'var(--color-warning-bg)' },
  invoice:   { label: 'Facture',    color: 'var(--color-primary)',    bg: 'var(--color-success-bg)' },
  aborted:   { label: 'Annulée',    color: 'var(--color-danger)',     bg: 'var(--color-danger-bg)' },
}
```

- [ ] **Step 3: TypeScript check + commit**

```bash
yarn tsc --noEmit
git add app/frontend/pages/Backend/Ventes/Index.tsx app/frontend/pages/Backend/Achats/CommandesIndex.tsx app/frontend/pages/Backend/Achats/FacturesIndex.tsx
git commit -m "refactor: convert Ventes, Commandes, Factures Index to Tailwind + ui components"
```

---

### Task 21: Interventions/Index.tsx + Parcelles/Index.tsx + Receptions/ReceptionsIndex.tsx

**Files:**
- Modify: `app/frontend/pages/Backend/Interventions/Index.tsx`
- Modify: `app/frontend/pages/Backend/Parcelles/Index.tsx`
- Modify: `app/frontend/pages/Backend/Receptions/ReceptionsIndex.tsx`

- [ ] **Step 1: Mettre à jour Interventions/Index.tsx**

Ce fichier est le plus complexe (3 vues : List, Kanban, Map). Changements ciblés :

1. Ajouter l'import `ViewToggle`, `FilterBar`, `PageHeader`, `SectionCard`, `StateBadge`, `Pagination`, `PrimaryButton` depuis `components/ui`.
2. Remplacer le header titre par `<PageHeader>`.
3. Remplacer les view toggle buttons par `<ViewToggle views={[...]} active={view} onChange={setView} />`.
4. Remplacer le bloc filter par `<FilterBar>`.
5. Dans la vue liste, remplacer le conteneur table par `<SectionCard noPadding>`.
6. Remplacer les badges d'état `STATE_CONFIG` couleurs :
```tsx
const STATE_CONFIG: Record<InterventionState, { label: string; color: string; bg: string; border: string }> = {
  in_progress: { label: 'En cours',   color: 'var(--color-warning)',      bg: 'var(--color-warning-bg)',  border: 'var(--color-warning)55' },
  done:        { label: 'Terminée',   color: 'var(--color-success)',      bg: 'var(--color-success-bg)',  border: 'var(--color-success)55' },
  validated:   { label: 'Validée',    color: 'var(--color-primary)',      bg: 'var(--color-bg-highlight)', border: 'var(--color-primary)55' },
  rejected:    { label: 'Rejetée',    color: 'var(--color-danger)',       bg: 'var(--color-danger-bg)',   border: 'var(--color-danger)55' },
}
```
7. Remplacer `#f0f7ec` hover par `var(--color-bg-highlight)`.
8. Remplacer `#1B6B3A` par `var(--color-primary)` partout.
9. Remplacer tous les inline layout styles par Tailwind equivalents.

- [ ] **Step 2: Mettre à jour Parcelles/Index.tsx**

Ce fichier affiche `ParcellesMap` + `ParcellesTable`. Les composants sont conservés. Changements :
1. Remplacer le header par `<PageHeader>`.
2. Remplacer le wrapper `<div style={{ background: 'var(--color-bg-card)'...}}>` de la map par `<SectionCard noPadding>`.
3. Remplacer le bouton "Nouvelle parcelle" par `<PrimaryButton>`.
4. Remplacer `#1B6B3A` par `var(--color-primary)`.
5. Remplacer tous les inline layout styles par Tailwind.

- [ ] **Step 3: Mettre à jour ReceptionsIndex.tsx**

1. Ajouter les imports ui.
2. Remplacer le header par `<PageHeader>`.
3. Remplacer les couleurs hors-palette :
   - `#1e40af`, `#bfdbfe`, `#eff6ff` → `var(--color-info)`, `var(--color-info-bg)`
   - `#854d0e` → `var(--color-warning-text)`
   - `#fef9c3` → `var(--color-warning-bg)`
4. Remplacer le tableau par `<DataTable>` + `<Pagination>`.
5. Remplacer tous les inline layout styles par Tailwind.

- [ ] **Step 4: TypeScript check + commit**

```bash
yarn tsc --noEmit
git add app/frontend/pages/Backend/Interventions/Index.tsx app/frontend/pages/Backend/Parcelles/Index.tsx app/frontend/pages/Backend/Receptions/ReceptionsIndex.tsx
git commit -m "refactor: convert Interventions, Parcelles, Receptions Index to Tailwind + ui components"
```

---

## PHASE 4 — Conversion des pages Form

> **Pattern général Form :** Remplacer `<div className="flex items-center gap-4 mb-6">` + titre + icône par `<BackLink>` + `<IconBox>` + `<PageHeader>`. Remplacer les cards par `<SectionCard>` + `<SectionTitle>`. Remplacer chaque champ par `<FormField>`. Remplacer les boutons par `<PrimaryButton>`. Remplacer les hexcodes hors-palette par var().

### Task 22: Form pages — Animaux, Travailleurs, Equipements, Campagnes, Activites

**Files:**
- Modify: `app/frontend/pages/Backend/Animaux/Form.tsx`
- Modify: `app/frontend/pages/Backend/Travailleurs/Form.tsx`
- Modify: `app/frontend/pages/Backend/Equipements/Form.tsx`
- Modify: `app/frontend/pages/Backend/Campagnes/Form.tsx`
- Modify: `app/frontend/pages/Backend/Activites/Form.tsx`

- [ ] **Step 1: Mettre à jour Animaux/Form.tsx**

Ajouter l'import :
```tsx
import { BackLink, IconBox, SectionCard, SectionTitle, FormField, PrimaryButton } from '../../../components/ui'
```

Remplacer le back link :
```tsx
// Avant
<div className="flex items-center gap-3 mb-6">
  <a href="/backend/animals" className="flex items-center gap-1 text-sm no-underline" style={{ color: 'var(--color-text-muted)' }}>
    <ArrowLeft size={16} /> Liste des animaux
  </a>
</div>
// Après
<BackLink href="/backend/animals" label="Liste des animaux" />
```

Remplacer le header icône :
```tsx
// Avant
<div className="flex items-center gap-4 mb-6">
  <div className="flex items-center justify-center rounded-lg w-12 h-12 shrink-0" style={{ background: 'var(--color-success-bg)' }}>
    <Beef size={22} style={{ color: 'var(--color-success-text)' }} />
  </div>
  <div><h1 ...>{titre}</h1></div>
</div>
// Après
<div className="flex items-center gap-4 mb-6">
  <IconBox icon={Beef} color="var(--color-success-text)" bg="var(--color-success-bg)" />
  <div>
    <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
      {isEdit ? `Modifier l'animal ${animal!.name}` : 'Nouvel animal'}
    </h1>
    <p className="mt-1 text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>...</p>
  </div>
</div>
```

Remplacer le bloc card du formulaire :
```tsx
// Avant
<div className="rounded-lg p-6" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
  <h2 ...>...</h2>
  <form>...</form>
</div>
// Après
<SectionCard>
  <SectionTitle icon={Beef}>Informations de l'animal</SectionTitle>
  <form onSubmit={handleSubmit} noValidate aria-label="Formulaire animal">
    <div className="flex flex-col gap-5">
```

Remplacer chaque champ par `<FormField>` :
```tsx
// Avant
<div>
  <label htmlFor="animal-name" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
    Nom <span style={{ color: 'var(--color-danger)' }}>*</span>
  </label>
  <input id="animal-name" ... className="w-full rounded px-3 py-2 text-sm outline-none"
    style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
  {errors.name && <p id="animal-name-error" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>{errors.name}</p>}
</div>
// Après
<FormField label="Nom" required htmlFor="animal-name" error={errors.name}>
  <input
    id="animal-name" type="text" value={name} onChange={e => setName(e.target.value)} required
    aria-invalid={!!errors.name || undefined} aria-describedby={errors.name ? 'animal-name-error' : undefined}
    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
    style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
    placeholder="ex. Bœuf Alpha"
  />
</FormField>
```

Remplacer les boutons d'action :
```tsx
// Avant
<div className="flex items-center gap-3 mt-6 pt-5" style={{ borderTop: '1px solid var(--color-border)' }}>
  <button type="submit" disabled={submitting} className="..." style={{ background: 'var(--color-primary)', ... }}>
    <Save size={15} /> {isEdit ? 'Enregistrer' : "Créer l'animal"}
  </button>
  <a href="/backend/animals" className="..." style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', ... }}>Annuler</a>
</div>
// Après
<div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
  <PrimaryButton type="submit" disabled={submitting}>
    <Save size={15} /> {isEdit ? 'Enregistrer' : "Créer l'animal"}
  </PrimaryButton>
  <PrimaryButton href="/backend/animals" variant="secondary">Annuler</PrimaryButton>
</div>
```

Appliquer le même pattern à **Travailleurs/Form.tsx**, **Equipements/Form.tsx**, **Campagnes/Form.tsx**, **Activites/Form.tsx** en adaptant les labels, icônes et champs.

- [ ] **Step 2: TypeScript check + commit**

```bash
yarn tsc --noEmit
git add app/frontend/pages/Backend/Animaux/Form.tsx app/frontend/pages/Backend/Travailleurs/Form.tsx app/frontend/pages/Backend/Equipements/Form.tsx app/frontend/pages/Backend/Campagnes/Form.tsx app/frontend/pages/Backend/Activites/Form.tsx
git commit -m "refactor: convert Animaux, Travailleurs, Equipements, Campagnes, Activites Form to ui components"
```

---

### Task 23: Form pages — Entites, Parcelles, Productions, Ventes, Interventions

**Files:**
- Modify: `app/frontend/pages/Backend/Entites/Form.tsx`
- Modify: `app/frontend/pages/Backend/Parcelles/Form.tsx`
- Modify: `app/frontend/pages/Backend/Productions/Form.tsx`
- Modify: `app/frontend/pages/Backend/Ventes/Form.tsx`
- Modify: `app/frontend/pages/Backend/Interventions/Form.tsx`

- [ ] **Step 1: Appliquer le pattern Form à chaque fichier**

Pour chaque fichier, les changements sont identiques au Task 22 :
1. Ajouter l'import `{ BackLink, IconBox, SectionCard, SectionTitle, FormField, PrimaryButton }` depuis `../../../components/ui`.
2. Remplacer le back link `<a href="..." ...>` par `<BackLink href="..." label="..." />`.
3. Remplacer le header icône par `<IconBox icon={...} color="var(--color-*)" bg="var(--color-*)" />`.
4. Remplacer les `<div className="rounded-lg p-6" style={{background: 'var(--color-bg-card)'...}}>` par `<SectionCard>`.
5. Remplacer les `<h2 className="text-sm font-semibold uppercase...">` par `<SectionTitle icon={...}>`.
6. Remplacer chaque groupe label+input+error par `<FormField label="..." error={...}>`.
7. Remplacer les boutons submit/annuler par `<PrimaryButton>`.
8. **Spécifique Ventes/Form.tsx** : conserver `VenteItemsEditor` — ne remplacer que l'enveloppe.
9. **Spécifique Interventions/Form.tsx** : conserver `ProcedureFormBuilder` — ne remplacer que l'enveloppe.
10. **Spécifique Parcelles/Form.tsx** : ce fichier est 100% inline styles — réécriture complète avec le pattern ci-dessus.

Remplacer dans **tous** les fichiers les couleurs hors-palette :
- `#dc2626` → `var(--color-danger)`
- `style={{ color: '#374151' }}` → `style={{ color: 'var(--color-text)' }}`
- `background: 'var(--color-primary-bg, #e8f5e9)'` → `background: 'var(--color-success-bg)'`

- [ ] **Step 2: TypeScript check + commit**

```bash
yarn tsc --noEmit
git add app/frontend/pages/Backend/Entites/Form.tsx app/frontend/pages/Backend/Parcelles/Form.tsx app/frontend/pages/Backend/Productions/Form.tsx app/frontend/pages/Backend/Ventes/Form.tsx app/frontend/pages/Backend/Interventions/Form.tsx
git commit -m "refactor: convert Entites, Parcelles, Productions, Ventes, Interventions Form to ui components"
```

---

### Task 24: Form pages — Achats, Réceptions, Alertes (IssueForm), Budgets, Catalogue

**Files:**
- Modify: `app/frontend/pages/Backend/Achats/CommandesForm.tsx`
- Modify: `app/frontend/pages/Backend/Achats/FacturesForm.tsx`
- Modify: `app/frontend/pages/Backend/Receptions/ReceptionsForm.tsx`
- Modify: `app/frontend/pages/Backend/Alertes/IssueForm.tsx`
- Modify: `app/frontend/pages/Backend/Budgets/Form.tsx`
- Modify: `app/frontend/pages/Backend/Catalogue/Form.tsx`

- [ ] **Step 1: Appliquer le pattern Form à chaque fichier**

Même pattern que Task 22-23. Spécificités :
- **CommandesForm / FacturesForm** : conserver `AchatItemsEditor` — ne remplacer que l'enveloppe. Ajouter `<TabNav>` si la navigation par onglets est absente.
- **ReceptionsForm** : conserver `ReceptionItemsEditor`.
- **IssueForm** : remplacer les couleurs hors-palette `#fef9c3`, `#854d0e`, `#dc2626` par les vars tokens.

Dans chaque fichier, remplacer systématiquement :
```
#1B6B3A → var(--color-primary)
#143F22 / #155829 → var(--color-primary-dark)
#dc2626 → var(--color-danger)
#fee2e2 → var(--color-danger-bg)
#fca5a5 → var(--color-danger-border)
#6b7280 → var(--color-text-muted)
#374151 → var(--color-text-muted)
```

- [ ] **Step 2: TypeScript check + commit**

```bash
yarn tsc --noEmit
git add app/frontend/pages/Backend/Achats/CommandesForm.tsx app/frontend/pages/Backend/Achats/FacturesForm.tsx app/frontend/pages/Backend/Receptions/ReceptionsForm.tsx app/frontend/pages/Backend/Alertes/IssueForm.tsx app/frontend/pages/Backend/Budgets/Form.tsx app/frontend/pages/Backend/Catalogue/Form.tsx
git commit -m "refactor: convert Achats, Receptions, IssueForm, Budgets, Catalogue Form to ui components"
```

---

## PHASE 5 — Conversion des pages Show

> **Pattern général Show :** `<BackLink>` en haut. Header : titre `font-heading` + `<StateBadge>` + boutons actions. Info card : `<SectionCard>` + `<SectionTitle>` + `<DetailRow>`. Tables liées : `<DataTable>`.

### Task 25: Show pages — Animaux, Travailleurs, Equipements, Campagnes, Activites, Entites

**Files:**
- Modify: `app/frontend/pages/Backend/Animaux/Show.tsx`
- Modify: `app/frontend/pages/Backend/Travailleurs/Show.tsx`
- Modify: `app/frontend/pages/Backend/Equipements/Show.tsx`
- Modify: `app/frontend/pages/Backend/Campagnes/Show.tsx`
- Modify: `app/frontend/pages/Backend/Activites/Show.tsx`
- Modify: `app/frontend/pages/Backend/Entites/Show.tsx`

- [ ] **Step 1: Appliquer le pattern Show à chaque fichier**

Pour chaque fichier :

1. Ajouter l'import :
```tsx
import { BackLink, IconBox, SectionCard, SectionTitle, DetailRow, DataTable, StateBadge, ActionGroup, PrimaryButton } from '../../../components/ui'
```

2. Remplacer le back link par `<BackLink>`.

3. Remplacer le header titre + state + actions. Exemple pour Campagnes/Show.tsx (déjà partiellement propre) :
```tsx
// Avant
<div className="flex justify-between items-start mb-6">
  <div>
    <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>{campagne.name}</h1>
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
      style={campagne.closed ? { background: '#fee2e2', color: '#991b1b' } : { background: '#d1fae5', color: '#065f46' }}>
      {campagne.closed ? 'Clôturée' : 'En cours'}
    </span>
  </div>
  <a href={`/backend/campaigns/${campagne.id}/edit`} className="px-3 py-1.5 rounded text-sm font-medium no-underline"
    style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
    Modifier
  </a>
</div>
// Après
<div className="flex justify-between items-start mb-6">
  <div>
    <h1 className="text-[26px] font-bold mb-2 m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>{campagne.name}</h1>
    <StateBadge
      label={campagne.closed ? 'Clôturée' : 'En cours'}
      color={campagne.closed ? 'var(--color-danger)' : 'var(--color-primary)'}
      bg={campagne.closed ? 'var(--color-danger-bg)' : 'var(--color-success-bg)'}
    />
  </div>
  <PrimaryButton href={`/backend/campaigns/${campagne.id}/edit`} variant="secondary">Modifier</PrimaryButton>
</div>
```

4. Remplacer les info cards par `<SectionCard>` + `<SectionTitle>` + `<DetailRow>` :
```tsx
// Avant
<div className="rounded-lg p-5 mb-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
  <h2 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
    <Calendar size={14} /> Informations
  </h2>
  <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
    <div>
      <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Année de récolte</dt>
      <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{campagne.harvest_year}</dd>
    </div>
  </dl>
</div>
// Après
<SectionCard className="mb-5">
  <SectionTitle icon={Calendar}>Informations</SectionTitle>
  <DetailRow items={[
    { label: 'Année de récolte', value: campagne.harvest_year },
    campagne.closed_at ? { label: 'Date de clôture', value: campagne.closed_at.slice(0, 10) } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>} />
</SectionCard>
```

5. Remplacer les tableaux par `<DataTable>`.

6. Pour **Campagnes/Show.tsx** les couleurs à remplacer dans `productionStateLabel` :
```tsx
const map: Record<string, { label: string; bg: string; color: string }> = {
  opened:  { label: 'Ouverte',     bg: 'var(--color-success-bg)', color: 'var(--color-success-text)' },
  closed:  { label: 'Clôturée',    bg: 'var(--color-danger-bg)',  color: 'var(--color-danger-text)' },
  aborted: { label: 'Abandonnée',  bg: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' },
}
```

7. Pour **Ventes/Show.tsx** le `STATE_CONFIG` :
```tsx
const STATE_CONFIG: Record<VenteState, { label: string; bg: string; color: string }> = {
  draft:    { label: 'Brouillon', bg: 'var(--color-bg-subtle)',   color: 'var(--color-text-muted)' },
  estimate: { label: 'Devis',     bg: 'var(--color-info-bg)',     color: 'var(--color-info)' },
  aborted:  { label: 'Annulé',    bg: 'var(--color-danger-bg)',   color: 'var(--color-danger-text)' },
  refused:  { label: 'Refusé',    bg: 'var(--color-warning-bg)',  color: 'var(--color-warning-text)' },
  order:    { label: 'Commande',  bg: 'var(--color-success-bg)',  color: 'var(--color-success-text)' },
  invoice:  { label: 'Facture',   bg: '#ede9fe',                  color: '#5b21b6' },
}
```

- [ ] **Step 2: TypeScript check + commit**

```bash
yarn tsc --noEmit
git add app/frontend/pages/Backend/Animaux/Show.tsx app/frontend/pages/Backend/Travailleurs/Show.tsx app/frontend/pages/Backend/Equipements/Show.tsx app/frontend/pages/Backend/Campagnes/Show.tsx app/frontend/pages/Backend/Activites/Show.tsx app/frontend/pages/Backend/Entites/Show.tsx
git commit -m "refactor: convert Animaux, Travailleurs, Equipements, Campagnes, Activites, Entites Show to ui components"
```

---

### Task 26: Show pages — Ventes, Interventions, Parcelles, Productions

**Files:**
- Modify: `app/frontend/pages/Backend/Ventes/Show.tsx`
- Modify: `app/frontend/pages/Backend/Interventions/Show.tsx`
- Modify: `app/frontend/pages/Backend/Parcelles/Show.tsx`
- Modify: `app/frontend/pages/Backend/Productions/Show.tsx`

- [ ] **Step 1: Appliquer le pattern Show à chaque fichier**

Même pattern que Task 25. Spécificités :

**Ventes/Show.tsx** :
- Remplacer `WorkflowButton` local par `<PrimaryButton>` avec les bonnes variantes.
- Remplacer `<div className="flex flex-wrap gap-2">` par `<ActionGroup>`.
- Remplacer STATE_CONFIG avec les vars tokens (voir ci-dessus).

**Interventions/Show.tsx** :
- Remplacer les couleurs inline `#f3f4f6`, `#374151` par `var(--color-bg-subtle)`, `var(--color-text-muted)`.
- Remplacer les status badges par `<StateBadge>`.

**Parcelles/Show.tsx** :
- Remplacer `#f3f4f6`, `#374151` par vars tokens.
- Remplacer les info cards et tableaux par composants ui.

**Productions/Show.tsx** :
- Remplacer `#dbeafe`, `#1d4ed8` par `var(--color-info-bg)`, `var(--color-info)`.
- Remplacer STATE_CONFIG par vars tokens.

- [ ] **Step 2: TypeScript check + commit**

```bash
yarn tsc --noEmit
git add app/frontend/pages/Backend/Ventes/Show.tsx app/frontend/pages/Backend/Interventions/Show.tsx app/frontend/pages/Backend/Parcelles/Show.tsx app/frontend/pages/Backend/Productions/Show.tsx
git commit -m "refactor: convert Ventes, Interventions, Parcelles, Productions Show to ui components"
```

---

### Task 27: Show pages — Achats (CommandesShow, FacturesShow), Réceptions, Alertes (IssueShow), Budgets, Catalogue

**Files:**
- Modify: `app/frontend/pages/Backend/Achats/CommandesShow.tsx`
- Modify: `app/frontend/pages/Backend/Achats/FacturesShow.tsx`
- Modify: `app/frontend/pages/Backend/Receptions/ReceptionsShow.tsx`
- Modify: `app/frontend/pages/Backend/Alertes/IssueShow.tsx`
- Modify: `app/frontend/pages/Backend/Budgets/Show.tsx`
- Modify: `app/frontend/pages/Backend/Catalogue/Show.tsx`

- [ ] **Step 1: Appliquer le pattern Show à chaque fichier**

Même pattern que Task 25. Spécificités :

**CommandesShow / FacturesShow** (100% inline styles) :
- Réécriture complète avec `<BackLink>`, `<SectionCard>`, `<DetailRow>`, `<DataTable>`, `<TabNav>`, `<ActionGroup>`.
- Ajouter `<TabNav tabs={[{href: '/backend/purchase_orders', label: 'Commandes', active: false}, {href: '/backend/purchase_invoices', label: 'Factures', active: false}]} />` en haut.

**ReceptionsShow** :
- Conserver `ReceptionItemsEditor` — remplacer uniquement l'enveloppe.

**IssueShow** :
- Remplacer les couleurs `#fef9c3`, `#854d0e` par `var(--color-warning-bg)`, `var(--color-warning-text)`.
- Remplacer les hexcodes danger par `var(--color-danger*)`.

**Budgets/Show.tsx + Catalogue/Show.tsx** :
- Appliquer le pattern Show complet.

- [ ] **Step 2: TypeScript check + commit**

```bash
yarn tsc --noEmit
git add app/frontend/pages/Backend/Achats/CommandesShow.tsx app/frontend/pages/Backend/Achats/FacturesShow.tsx app/frontend/pages/Backend/Receptions/ReceptionsShow.tsx app/frontend/pages/Backend/Alertes/IssueShow.tsx app/frontend/pages/Backend/Budgets/Show.tsx app/frontend/pages/Backend/Catalogue/Show.tsx
git commit -m "refactor: convert Achats, Receptions, IssueShow, Budgets, Catalogue Show to ui components"
```

---

## PHASE 6 — Vérification finale

### Task 28: TypeScript + tests complets + audit résiduel

**Files:** Aucun — vérification uniquement.

- [ ] **Step 1: TypeScript check complet**

```bash
cd ekylibre-main && yarn tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Run tous les tests unitaires**

```bash
yarn vitest run
```

Expected: all PASS (les tests existants ne doivent pas régresser).

- [ ] **Step 3: Audit résiduel des hexcodes**

```bash
grep -rn "#1B6B3A\|#D4841A\|#fee2e2\|#d1fae5\|#374151\|#f3f4f6\|#dbeafe\|#065f46\|#dc2626\|#fca5a5\|#6b7280" app/frontend/pages/ app/frontend/components/
```

Expected: 0 matches dans les pages et composants (sauf si valeur vraiment dynamique non couverte par un token).

- [ ] **Step 4: Audit inline styles layout résiduels**

```bash
grep -rn "display: 'flex'\|padding: '\|marginBottom: '\|borderRadius: '\|fontSize: '\|fontWeight: [0-9]" app/frontend/pages/ app/frontend/components/
```

Expected: résultats uniquement dans les composants ui eux-mêmes (non dans les pages).

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore: design system compliance — all pages use Tailwind + CSS vars + shared ui components"
```
