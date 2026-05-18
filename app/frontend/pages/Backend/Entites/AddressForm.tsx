import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Link2, MapPin, Save } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { AddressFormProps } from '../../../types/entite'

/**
 * Note: Inline style attributes with CSS variables (e.g., style={{ color: 'var(--color-text)' }})
 * are used consistently across the SenagrOS frontend. This is an intentional project pattern
 * for applying design tokens defined in app/frontend/styles/tokens.css.
 */

const CANAL_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'fax', label: 'Fax' },
  { value: 'mail', label: 'Adresse postale' },
  { value: 'website', label: 'Site web' },
]

const CANAL_PLACEHOLDERS: Record<string, string> = {
  email: 'ex. contact@example.com',
  phone: 'ex. +221 33 000 0000',
  mobile: 'ex. +221 77 000 0000',
  fax: 'ex. +221 33 000 0001',
  website: 'ex. https://www.example.com',
}

const errorStyle = {
  fontSize: '11px',
  color: 'var(--color-danger)',
  marginTop: '4px',
}

const inputStyle = {
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  outline: 'none',
}

const AddressForm = ({ address, entity_id, errors }: AddressFormProps) => {
  const isEdit = address !== null

  const [canal, setCanal] = useState<string>(address?.canal ?? 'email')
  const [coordinate, setCoordinate] = useState<string>(address?.coordinate ?? '')
  const [mailLine4, setMailLine4] = useState<string>(address?.mail_line_4 ?? '')
  const [mailLine6, setMailLine6] = useState<string>(address?.mail_line_6 ?? '')
  const [mailCountry, setMailCountry] = useState<string>(address?.mail_country ?? '')
  const [submitting, setSubmitting] = useState(false)

  const isMail = canal === 'mail'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const data = {
      entity_address: {
        canal,
        coordinate: isMail ? `${mailLine4}, ${mailLine6}` : coordinate,
        mail_line_4: isMail ? mailLine4 : '',
        mail_line_6: isMail ? mailLine6 : '',
        mail_country: isMail ? mailCountry : '',
      },
    }
    if (isEdit) {
      router.patch(
        `/backend/entities/${entity_id}/addresses/${address!.id}`,
        data,
        { onFinish: () => setSubmitting(false) }
      )
    } else {
      router.post(
        `/backend/entities/${entity_id}/addresses`,
        data,
        { onFinish: () => setSubmitting(false) }
      )
    }
  }

  return (
    <>
      {/* Back link */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href={`/backend/entities/${entity_id}`}
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Retour à l'entité
        </a>
      </div>

      {/* Icon header + Title */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="flex items-center justify-center rounded-lg w-12 h-12 shrink-0"
          style={{ background: 'var(--color-primary-bg)' }}
        >
          <MapPin size={22} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            {isEdit ? "Modifier l'adresse" : 'Nouvelle adresse'}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Contact pour l'entité
          </p>
        </div>
      </div>

      {/* Form card */}
      <div
        className="rounded-lg p-6"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <h2
          className="text-sm font-semibold uppercase tracking-wide mb-5 flex items-center gap-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Link2 size={14} /> Informations de contact
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">
            {/* Canal */}
            <div>
              <label
                htmlFor="addr-canal"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Canal <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select
                id="addr-canal"
                value={canal}
                onChange={(e) => setCanal(e.target.value)}
                aria-invalid={!!errors.canal || undefined}
                aria-describedby={errors.canal ? 'addr-canal-error' : undefined}
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
              >
                {CANAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.canal && (
                <p id="addr-canal-error" style={errorStyle}>
                  {errors.canal}
                </p>
              )}
            </div>

            {/* Coordinate — visible when canal is not 'mail' */}
            {!isMail && (
              <div>
                <label
                  htmlFor="addr-coordinate"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Valeur <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="addr-coordinate"
                  type="text"
                  value={coordinate}
                  onChange={(e) => setCoordinate(e.target.value)}
                  required
                  aria-invalid={!!errors.coordinate || undefined}
                  aria-describedby={errors.coordinate ? 'addr-coordinate-error' : undefined}
                  className="w-full rounded px-3 py-2 text-sm"
                  style={inputStyle}
                  placeholder={CANAL_PLACEHOLDERS[canal] ?? ''}
                />
                {errors.coordinate && (
                  <p id="addr-coordinate-error" style={errorStyle}>
                    {errors.coordinate}
                  </p>
                )}
              </div>
            )}

            {/* Mail fields — visible when canal is 'mail' */}
            {isMail && (
              <>
                <div>
                  <label
                    htmlFor="addr-line4"
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Rue / BP <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    id="addr-line4"
                    type="text"
                    value={mailLine4}
                    onChange={(e) => setMailLine4(e.target.value)}
                    aria-invalid={!!errors.coordinate || undefined}
                    className="w-full rounded px-3 py-2 text-sm"
                    style={inputStyle}
                    placeholder="ex. 12 Rue des Baobabs, BP 1234"
                  />
                </div>

                <div>
                  <label
                    htmlFor="addr-line6"
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Ville / CP <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    id="addr-line6"
                    type="text"
                    value={mailLine6}
                    onChange={(e) => setMailLine6(e.target.value)}
                    className="w-full rounded px-3 py-2 text-sm"
                    style={inputStyle}
                    placeholder="ex. Dakar 10000"
                  />
                </div>

                <div>
                  <label
                    htmlFor="addr-country"
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Code pays
                  </label>
                  <input
                    id="addr-country"
                    type="text"
                    value={mailCountry}
                    onChange={(e) => setMailCountry(e.target.value)}
                    maxLength={2}
                    className="w-full rounded px-3 py-2 text-sm"
                    style={inputStyle}
                    placeholder="ex. SN, FR, CI"
                  />
                </div>

                {errors.coordinate && (
                  <p style={errorStyle}>{errors.coordinate}</p>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div
            className="flex items-center gap-3 mt-6 pt-5"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              <Save size={15} />
              {isEdit ? 'Enregistrer' : 'Créer l\'adresse'}
            </button>
            <a
              href={`/backend/entities/${entity_id}`}
              className="px-4 py-2 rounded text-sm font-medium no-underline"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              Annuler
            </a>
          </div>
        </form>
      </div>
    </>
  )
}

AddressForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default AddressForm
