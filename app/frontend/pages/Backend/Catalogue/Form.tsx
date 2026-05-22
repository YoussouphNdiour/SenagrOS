import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Save } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { CatalogueFormProps } from '../../../types/catalogue'

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  outline: 'none',
}

const errorStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-danger)',
  marginTop: '4px',
}

export default function CatalogueForm({ produit, errors }: CatalogueFormProps) {
  const [name, setName] = useState(produit.name)
  const [workNumber, setWorkNumber] = useState(produit.work_number ?? '')
  const [description, setDescription] = useState(produit.description ?? '')
  const [bornAt, setBornAt] = useState(produit.born_at ?? '')
  const [deadAt, setDeadAt] = useState(produit.dead_at ?? '')
  const [identificationNumber, setIdentificationNumber] = useState(produit.identification_number ?? '')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)

    const data: Record<string, string> = {
      'product[name]': name,
      'product[work_number]': workNumber,
      'product[description]': description,
      'product[born_at]': bornAt,
      'product[dead_at]': deadAt,
    }

    if (produit.produit_type === 'Animal') {
      data['product[identification_number]'] = identificationNumber
    }

    router.patch(`/backend/products/${produit.id}`, data, {
      onFinish: () => setSubmitting(false),
    })
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-4">
        <a
          href="/backend/products"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={15} />
          Retour au catalogue
        </a>
      </div>

      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
        Modifier — {produit.name}
      </h1>

      <div
        className="rounded-lg p-6"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <form onSubmit={handleSubmit} noValidate aria-label="Formulaire produit">
          <div className="flex flex-col gap-5">

            {/* Nom */}
            <div>
              <label
                htmlFor="product-name"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Nom <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="product-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
              />
              {errors.name && <p style={errorStyle}>{errors.name}</p>}
            </div>

            {/* Numero de travail */}
            <div>
              <label
                htmlFor="product-work-number"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Numero de travail
              </label>
              <input
                id="product-work-number"
                type="text"
                value={workNumber}
                onChange={(e) => setWorkNumber(e.target.value)}
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
              />
              {errors.work_number && <p style={errorStyle}>{errors.work_number}</p>}
            </div>

            {/* born_at / dead_at */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="product-born-at"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Date de naissance
                </label>
                <input
                  id="product-born-at"
                  type="date"
                  value={bornAt}
                  onChange={(e) => setBornAt(e.target.value)}
                  className="w-full rounded px-3 py-2 text-sm"
                  style={inputStyle}
                />
                {errors.born_at && <p style={errorStyle}>{errors.born_at}</p>}
              </div>
              <div>
                <label
                  htmlFor="product-dead-at"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Date de deces
                </label>
                <input
                  id="product-dead-at"
                  type="date"
                  value={deadAt}
                  onChange={(e) => setDeadAt(e.target.value)}
                  className="w-full rounded px-3 py-2 text-sm"
                  style={inputStyle}
                />
                {errors.dead_at && <p style={errorStyle}>{errors.dead_at}</p>}
              </div>
            </div>

            {/* identification_number — Animal uniquement */}
            {produit.produit_type === 'Animal' && (
              <div>
                <label
                  htmlFor="product-identification-number"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  {`Numéro d'identification`}
                </label>
                <input
                  id="product-identification-number"
                  type="text"
                  value={identificationNumber}
                  onChange={(e) => setIdentificationNumber(e.target.value)}
                  className="w-full rounded px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label
                htmlFor="product-description"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Description
              </label>
              <textarea
                id="product-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded px-3 py-2 text-sm"
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              {errors.description && <p style={errorStyle}>{errors.description}</p>}
            </div>

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
              Enregistrer
            </button>
            <a
              href={`/backend/products/${produit.id}`}
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
    </div>
  )
}

CatalogueForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
