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
