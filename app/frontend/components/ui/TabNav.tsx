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
