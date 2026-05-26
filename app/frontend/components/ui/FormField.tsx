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
