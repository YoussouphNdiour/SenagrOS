import { Crosshair, Tractor, User, Package, Sprout } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ProcedureSchema, ProcedureParameter } from '../../types/intervention'

interface ProcedureFormBuilderProps {
  schema: ProcedureSchema
}

type GroupKey = 'target' | 'tool' | 'doer' | 'input' | 'output'

interface GroupConfig {
  label: string
  icon: LucideIcon
  hasQuantity: boolean
}

const GROUP_CONFIG: Record<GroupKey, GroupConfig> = {
  target: { label: 'Cibles',       icon: Crosshair, hasQuantity: false },
  tool:   { label: 'Équipements',  icon: Tractor,   hasQuantity: false },
  doer:   { label: 'Intervenants', icon: User,       hasQuantity: false },
  input:  { label: 'Intrants',     icon: Package,    hasQuantity: true  },
  output: { label: 'Produits',     icon: Sprout,     hasQuantity: true  },
} as const

const GROUP_ORDER: GroupKey[] = ['target', 'tool', 'doer', 'input', 'output']

const inputStyle = {
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  outline: 'none',
}

interface ParamRowProps {
  groupKey: GroupKey
  param: ProcedureParameter
  hasQuantity: boolean
}

function ParamRow({ groupKey, param, hasQuantity }: ParamRowProps) {
  const productId = `${groupKey}-${param.name}-product`
  const quantityValueId = `${groupKey}-${param.name}-qty-value`
  const quantityUnitId = `${groupKey}-${param.name}-qty-unit`

  return (
    <div style={{ marginBottom: '12px' }}>
      <label
        htmlFor={productId}
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--color-text-muted)',
          marginBottom: '6px',
        }}
      >
        {param.label}
      </label>
      <input
        id={productId}
        type="text"
        name={`intervention[${groupKey}_participants][${param.name}][product_name]`}
        placeholder="Nom du produit…"
        style={inputStyle}
        className="w-full rounded px-3 py-2 text-sm"
      />
      {hasQuantity && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <input
            id={quantityValueId}
            type="number"
            name={`intervention[${groupKey}_participants][${param.name}][quantity_value]`}
            min="0"
            placeholder="0"
            style={{ ...inputStyle, flex: '0 0 100px' }}
            className="rounded px-3 py-2 text-sm"
          />
          <input
            id={quantityUnitId}
            type="text"
            name={`intervention[${groupKey}_participants][${param.name}][quantity_unit]`}
            placeholder="unité (kg, L…)"
            style={{ ...inputStyle, flex: 1 }}
            className="rounded px-3 py-2 text-sm"
          />
        </div>
      )}
    </div>
  )
}

interface GroupSectionProps {
  groupKey: GroupKey
  params: ProcedureParameter[]
  config: GroupConfig
}

function GroupSection({ groupKey, params, config }: GroupSectionProps) {
  const Icon = config.icon
  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
      className="rounded-lg p-5 mt-4"
    >
      <h3
        style={{ color: 'var(--color-text-muted)' }}
        className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2"
      >
        <Icon size={14} /> {config.label}
      </h3>
      {params.map(param => (
        <ParamRow
          key={param.name}
          groupKey={groupKey}
          param={param}
          hasQuantity={config.hasQuantity}
        />
      ))}
    </div>
  )
}

export function ProcedureFormBuilder({ schema }: ProcedureFormBuilderProps) {
  const nonEmptyGroups = GROUP_ORDER.filter(
    key => schema.groups[key].length > 0,
  )

  if (nonEmptyGroups.length === 0) {
    return null
  }

  return (
    <div>
      {nonEmptyGroups.map(key => (
        <GroupSection
          key={key}
          groupKey={key}
          params={schema.groups[key]}
          config={GROUP_CONFIG[key]}
        />
      ))}
    </div>
  )
}
