# Design System Compliance — SenagrOS Frontend

**Date:** 2026-05-26  
**Scope:** Tous les modules — 15 Index, ~15 Form, ~15 Show, composants existants  
**Objectif:** Mettre 100% du frontend en conformité avec le design system SenagrOS défini dans `tokens.css` et `CLAUDE.md`

---

## Contexte

Le CLAUDE.md établit deux règles CSS fondamentales :
- **Tailwind utility classes** pour le layout, spacing, typographie, border-radius
- **CSS custom properties** (`var(--color-*)`) pour les couleurs, ombres, polices
- **Jamais de style inline** pour ce que Tailwind peut exprimer

En pratique, le codebase présente 3 catégories de violations :

1. **Pages Index (15 fichiers)** — 100% inline styles, zéro Tailwind
2. **Pages Show/Form** — mix de Tailwind et inline, couleurs hors-palette hardcodées (`#374151`, `#dbeafe`, `#065f46`, `#f3f4f6`…)
3. **Partout** — couleurs du token palette écrites en dur (`#1B6B3A` au lieu de `var(--color-primary)`)

---

## Approche

**Approche 1 (composants partagés) + Approche 2 (conformité token)** combinées.

1. Compléter `tokens.css` avec les variables manquantes
2. Créer 20 composants primitifs dans `components/ui/`
3. Passer tous les fichiers pour remplacer inline styles → Tailwind + composants + `var()`

---

## Règles d'implémentation

### CSS

```
✅ className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold"
✅ style={{ color: 'var(--color-text-muted)' }}          ← CSS var only
✅ style={{ background: 'var(--color-primary)' }}

❌ style={{ display: 'flex', gap: '12px', padding: '8px 14px' }}
❌ style={{ color: '#6B5E4E' }}                          ← hardcoded hex
❌ style={{ fontSize: '13px', fontWeight: 600 }}         ← Tailwind existe
```

### Règle inline style résiduel autorisé

L'inline style est acceptable **uniquement** pour des valeurs dynamiques ou des CSS custom properties :
- `style={{ color: 'var(--color-primary)' }}` ✅
- `style={{ width: `${pct}%` }}` ✅ (valeur calculée)
- `style={{ color: '#1B6B3A' }}` ❌ (hardcoded)
- `style={{ padding: '16px' }}` ❌ (Tailwind: `p-4`)

### Couleurs interdites (remplacer par var)

| Hardcode interdit | Remplacer par |
|-------------------|---------------|
| `#1B6B3A` | `var(--color-primary)` |
| `#143F22` / `#155829` | `var(--color-primary-dark)` |
| `#4CAF72` | `var(--color-primary-light)` |
| `#2D7A3A` | `var(--color-success)` |
| `#d1fae5` | `var(--color-success-bg)` |
| `#D4841A` | `var(--color-warning)` |
| `#fef3c7` | `var(--color-warning-bg)` |
| `#92400e` | `var(--color-warning-text)` |
| `#D4420A` | `var(--color-danger)` |
| `#fee2e2` | `var(--color-danger-bg)` |
| `#991b1b` | `var(--color-danger-text)` |
| `#1f6f8b` | `var(--color-info)` |
| `#e0f2fe` | `var(--color-info-bg)` |
| `#F7F3EE` | `var(--color-bg)` |
| `#FFFFFF` | `var(--color-bg-card)` |
| `#f0f7ec` | `var(--color-bg-highlight)` |
| `#2C2416` | `var(--color-text)` |
| `#6B5E4E` | `var(--color-text-muted)` |
| `#E2D9CE` | `var(--color-border)` |
| `#374151` | `var(--color-text-muted)` |
| `#f3f4f6` | `var(--color-bg-subtle)` |
| `#065f46` | `var(--color-success-text)` |
| `#166534` | `var(--color-success-text)` |
| `#dbeafe` | `var(--color-info-bg)` |
| `#1d4ed8` | `var(--color-info)` |
| `#1e40af` | `var(--color-info)` |
| `#6b7280` | `var(--color-text-muted)` |
| `#dc2626` | `var(--color-danger)` |
| `#fca5a5` | `var(--color-danger-border)` |

---

## Étape 1 — Tokens CSS manquants

Ajouter dans `tokens.css` (section Semantic) :

```css
--color-info-bg:        #e0f2fe;
--color-info-text:      #1f6f8b;
--color-success-text:   #065f46;
--color-danger-border:  #fca5a5;
--color-bg-subtle:      #f9f7f4;   /* déjà présent — vérifier */
```

Le token `--color-danger-text` existe déjà (`#991b1b`). Vérifier que `--color-bg-subtle` est bien présent.

---

## Étape 2 — 20 Composants partagés (`components/ui/`)

### 2.1 `BackLink`

```tsx
interface BackLinkProps {
  href: string
  label: string
}
```

Rendu : `← {label}` en `text-sm`, couleur `var(--color-text-muted)`, pas de soulignement.  
Classes Tailwind : `flex items-center gap-1 text-sm no-underline mb-6`

---

### 2.2 `IconBox`

```tsx
interface IconBoxProps {
  icon: LucideIcon
  color: string       // CSS var ou hex dynamique
  bg: string          // CSS var ou hex dynamique
  size?: number       // default 48
  rounded?: boolean   // default false → rounded-xl ; true → rounded-full
}
```

Rendu : carré/cercle avec icône centrée. Utilisé dans les headers de Form/Show.  
Classes : `flex items-center justify-center shrink-0`  
Taille via `style={{ width, height }}` (valeur dynamique).

---

### 2.3 `PageHeader`

```tsx
interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode   // slot CTA (bouton ou lien)
}
```

Rendu : flex row, titre en `var(--font-heading)` 26px bold, subtitle 13px muted, action à droite.  
Classes : `flex justify-between items-start mb-5 gap-4`

---

### 2.4 `PrimaryButton`

```tsx
interface PrimaryButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md'
  disabled?: boolean
  type?: 'button' | 'submit'
  href?: string        // rend un <a> si fourni
  onClick?: () => void
}
```

Variantes :
- `primary` : `linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)`, texte blanc, border `var(--color-primary-dark)`, `box-shadow: 0 1px 0 rgba(255,255,255,0.18) inset`
- `secondary` : `var(--color-bg-card)`, border `var(--color-border)`, texte `var(--color-text)`
- `danger` : `var(--color-danger-bg)`, border `var(--color-danger-border)`, texte `var(--color-danger-text)`

Classes communes : `inline-flex items-center gap-1.5 rounded-lg font-semibold text-sm no-underline`  
Size `md` : `px-3.5 py-2` | Size `sm` : `px-2.5 py-1.5 text-xs`

---

### 2.5 `SectionCard`

```tsx
interface SectionCardProps {
  children: ReactNode
  className?: string
  noPadding?: boolean   // pour les tables qui touchent les bords
}
```

Classes : `rounded-[var(--radius-card)] overflow-hidden`  
Style : `background: var(--color-bg-card)`, `border: 1px solid var(--color-border)`, `box-shadow: var(--shadow-card)`

---

### 2.6 `SectionTitle`

```tsx
interface SectionTitleProps {
  icon?: LucideIcon
  children: ReactNode
}
```

Rendu : texte `10px` uppercase bold muted + icône 14px.  
Classes : `flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest mb-4`  
Style : `color: var(--color-text-muted)`

---

### 2.7 `DetailRow` (pour les pages Show)

```tsx
interface DetailRowProps {
  items: Array<{
    label: string
    value: ReactNode
    fullWidth?: boolean
  }>
  cols?: 2 | 3   // default 2
}
```

Rendu : `<dl>` en grille, chaque item = `<dt>` label xs muted + `<dd>` sm medium.  
Classes : `grid gap-x-6 gap-y-3` + `grid-cols-2` ou `grid-cols-3`

---

### 2.8 `StateBadge`

```tsx
interface StateBadgeProps {
  label: string
  color: string   // CSS var
  bg: string      // CSS var
  border?: string // CSS var, optionnel
  dot?: boolean   // afficher le point coloré, default true
}
```

Rendu : pill `rounded-full`, dot optionnel, texte xs semibold.  
Classes : `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap`

---

### 2.9 `CodeBadge`

```tsx
interface CodeBadgeProps {
  value: string
  variant?: 'default' | 'warning'  // warning = "Code manquant"
}
```

Rendu : pill monospace, fond `var(--color-info-bg)`, texte `var(--color-info-text)`.  
Variante `warning` : fond `var(--color-warning-bg)`, texte `var(--color-warning-text)`.  
Classes : `inline-block px-2 py-0.5 rounded text-xs font-bold font-mono whitespace-nowrap`

---

### 2.10 `KpiCard`

```tsx
interface KpiCardProps {
  icon: ReactNode
  label: string
  value: string | number
  color: string    // CSS var pour l'icône
}
```

Rendu : card flex avec icon tile 36px + label uppercase + valeur en heading font 22px.  
Classes (card) : `flex items-center gap-3 p-4 rounded-[var(--radius-card)]`  
Style card : `background: var(--color-bg-card)`, `border: 1px solid var(--color-border)`, `box-shadow: var(--shadow-card)`  
Icon tile : `w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0`

---

### 2.11 `EmptyState`

```tsx
interface EmptyStateProps {
  icon: LucideIcon
  message: string
  colSpan?: number   // si dans un <tbody>
  asTableRow?: boolean
}
```

Rendu : icône à 30% opacité + texte centré, padding 48px.  
Classes : `text-center py-12`  
Style : `color: var(--color-text-muted)`

---

### 2.12 `Pagination`

```tsx
interface PaginationProps {
  page: number
  totalPages: number
  total: number
  onPrev: () => void
  onNext: () => void
  className?: string
}
```

Rendu : flex row `justify-between`, texte "Page X sur Y — N résultats", boutons Précédent/Suivant désactivés en bout de liste.  
Classes (wrapper) : `flex items-center justify-between px-4 py-3 border-t`  
Style border-t : `border-color: var(--color-border)`, `background: var(--color-bg)`

---

### 2.13 `ProgressBar`

```tsx
interface ProgressBarProps {
  value: number          // ex. reception_items_count
  max: number            // ex. purchase_items_count
  fillColor?: string     // default var(--color-primary)
  trackColor?: string    // default var(--color-border)
  height?: number        // default 4
  label?: string         // ex. "3/5 reçus"
}
```

Rendu : track rounded + fill animé + label optionnel à droite.  
Classes (track) : `flex-1 rounded-full overflow-hidden`  
Style track : `background: var(--color-border)`, `height: {height}px`  
Fill : `style={{ width: \`${Math.min(100, (value/max)*100)}%\`, background: fillColor, transition: 'width 0.3s' }}`

---

### 2.14 `ViewToggle`

```tsx
interface ViewToggleProps {
  views: Array<{ key: string; label: string; icon: LucideIcon }>
  active: string
  onChange: (key: string) => void
}
```

Rendu : groupe de boutons segmentés, actif = fond `var(--color-bg-highlight)` + border `var(--color-primary)`.  
Classes (groupe) : `flex gap-1.5`  
Classes (bouton) : `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold`

---

### 2.15 `FilterBar`

```tsx
interface FilterBarProps {
  children: ReactNode   // les inputs/selects/pills passés en slot
  onSubmit?: () => void
}
```

Rendu : wrapper card flex-wrap avec les contrôles de filtre passés en children.  
Classes : `flex gap-2.5 items-center flex-wrap p-3 rounded-[var(--radius-card)]`  
Style : `background: var(--color-bg-card)`, `border: 1px solid var(--color-border)`, `box-shadow: var(--shadow-card)`

---

### 2.16 `DataTable`

```tsx
interface DataTableProps<T> {
  columns: Array<{
    key: string
    label: string
    align?: 'left' | 'right' | 'center'
    width?: string
  }>
  data: T[]
  renderRow: (item: T, index: number) => ReactNode
  footer?: ReactNode
  emptyMessage?: string
  emptyIcon?: LucideIcon
}
```

Rendu : `<table>` full width, thead uppercase muted, tbody avec hover `var(--color-bg-highlight)`, dividers `var(--color-border)`.  
Classes (table) : `w-full border-collapse`  
Classes (th) : `px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest`

---

### 2.17 `ActionGroup`

```tsx
interface ActionGroupProps {
  actions: Array<{
    label: string
    icon: LucideIcon
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'danger'
    disabled?: boolean
  }>
}
```

Rendu : flex row de `PrimaryButton`, gap 2.  
Classes : `flex flex-wrap gap-2`

---

### 2.18 `ConfirmDeleteButton`

```tsx
interface ConfirmDeleteButtonProps {
  onDelete: () => void
  message?: string   // default "Supprimer cet élément ?"
  label?: string     // default "Supprimer"
  size?: 'sm' | 'md'
}
```

Utilise `PrimaryButton` variante `danger` + `window.confirm` avant d'appeler `onDelete`.

---

### 2.19 `FormField`

```tsx
interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  help?: string
  children: ReactNode  // l'input, select, textarea
  htmlFor?: string
}
```

Rendu : `<div>` avec label + slot children + message erreur rouge.  
Classes (label) : `block text-sm font-medium mb-1`  
Style label : `color: var(--color-text)`  
Classes (erreur) : `text-xs mt-1`  
Style erreur : `color: var(--color-danger)`

---

### 2.20 `TabNav`

```tsx
interface TabNavProps {
  tabs: Array<{ href: string; label: string; active: boolean }>
}
```

Rendu : flex row d'ancres, onglet actif = border-bottom `var(--color-primary)` 2px + couleur primary, inactif = muted.  
Classes (wrapper) : `flex border-b mb-5`  
Style border : `border-color: var(--color-border)`  
Classes (tab) : `px-5 py-2 text-sm font-medium no-underline -mb-px`

---

## Étape 3 — Conversion des fichiers existants

### Ordre de conversion

1. `tokens.css` — ajouter les variables manquantes
2. `components/ui/` — créer les 20 composants
3. **Index pages** (15) — conversion complète inline → Tailwind + composants
4. **Form pages** (~15) — remplacer inline styles layout + couleurs hors-palette
5. **Show pages** (~15) — idem + utiliser `DetailRow`, `DataTable`, `ActionGroup`
6. **Composants existants** — `AchatsTabs` → `TabNav`, vérifier les autres

### Tailwind equivalents clés

| Inline style actuel | Classe Tailwind |
|---------------------|-----------------|
| `display: 'flex'` | `flex` |
| `alignItems: 'center'` | `items-center` |
| `justifyContent: 'space-between'` | `justify-between` |
| `flexWrap: 'wrap'` | `flex-wrap` |
| `gap: '8px'` | `gap-2` |
| `gap: '12px'` | `gap-3` |
| `gap: '16px'` | `gap-4` |
| `padding: '8px 14px'` | `px-3.5 py-2` |
| `padding: '12px 16px'` | `px-4 py-3` |
| `marginBottom: '20px'` | `mb-5` |
| `marginBottom: '22px'` | `mb-5` |
| `borderRadius: '8px'` | `rounded-lg` |
| `borderRadius: '10px'` | `rounded-[10px]` |
| `borderRadius: '999px'` | `rounded-full` |
| `fontSize: '10px'` | `text-[10px]` |
| `fontSize: '11px'` | `text-xs` |
| `fontSize: '12px'` | `text-xs` |
| `fontSize: '13px'` | `text-sm` |
| `fontSize: '14px'` | `text-sm` |
| `fontSize: '22px'` | `text-2xl` |
| `fontSize: '26px'` | `text-[26px]` |
| `fontWeight: 600` | `font-semibold` |
| `fontWeight: 700` | `font-bold` |
| `textTransform: 'uppercase'` | `uppercase` |
| `letterSpacing: '0.06em'` | `tracking-widest` |
| `whiteSpace: 'nowrap'` | `whitespace-nowrap` |
| `overflow: 'hidden'` | `overflow-hidden` |
| `textOverflow: 'ellipsis'` | `truncate` |
| `textDecoration: 'none'` | `no-underline` |
| `flexShrink: 0` | `shrink-0` |
| `flex: 1, minWidth: 0` | `flex-1 min-w-0` |
| `cursor: 'pointer'` | `cursor-pointer` |
| `cursor: 'not-allowed'` | `cursor-not-allowed` |
| `width: '100%'` | `w-full` |
| `minHeight: '100vh'` | `min-h-screen` |
| `listStyle: 'none'` | `list-none` |
| `borderCollapse: 'collapse'` | `border-collapse` |

---

## Périmètre complet

**Fichiers à modifier :** ~45 fichiers `.tsx`

| Catégorie | Fichiers | Changements |
|-----------|----------|-------------|
| `tokens.css` | 1 | Ajouter 4 variables |
| `components/ui/` | 20 nouveaux | Créer de zéro |
| Pages Index | 15 | Réécriture complète |
| Pages Form | ~14 | Remplacement inline + couleurs |
| Pages Show | ~14 | Remplacement inline + composants |
| Composants existants | 6 | Mise à jour |

**TypeScript check** obligatoire après chaque batch de fichiers.

---

## Contraintes

- TypeScript strict — aucun `any`
- Chaque composant `components/ui/` reçoit des props typées avec interface explicite
- Les composants `ui/` n'importent pas de types métier (intervention, animal…) — ils sont génériques
- `AchatsTabs` peut rester mais s'appuyer sur `TabNav` pour le rendu
- Ne pas modifier les types dans `types/` — seulement les fichiers UI
