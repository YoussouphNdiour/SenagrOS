import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Mail, MapPin, Phone, Plus, Save, User, Users, X } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { EntiteEmail, EntiteFormProps, EntiteMail, EntitePhone } from '../../../types/entite'

/**
 * Note: Inline style attributes with CSS variables (e.g., style={{ color: 'var(--color-text)' }})
 * are used consistently across the SenagrOS frontend. This is an intentional project pattern
 * for applying design tokens defined in app/frontend/styles/tokens.css.
 */

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

const cardStyle = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-card)',
}

const EntitesForm = ({ entite, errors }: EntiteFormProps) => {
  const isEdit = entite !== null

  const [nature, setNature] = useState<string>(entite?.nature ?? 'organization')
  const [title, setTitle] = useState<string>(entite?.title ?? '')
  const [firstName, setFirstName] = useState<string>(entite?.first_name ?? '')
  const [lastName, setLastName] = useState<string>(entite?.last_name ?? '')
  const [bornAt, setBornAt] = useState<string>(entite?.born_at ?? '')
  const [deadAt, setDeadAt] = useState<string>(entite?.dead_at ?? '')
  const [language, setLanguage] = useState<string>(entite?.language ?? 'fra')
  const [description, setDescription] = useState<string>(entite?.description ?? '')
  const [emails, setEmails] = useState<EntiteEmail[]>(entite?.emails ?? [])
  const [phones, setPhones] = useState<EntitePhone[]>(entite?.phones ?? [])
  const [mails, setMails] = useState<EntiteMail[]>(entite?.mails ?? [])
  const [submitting, setSubmitting] = useState(false)

  // Email helpers
  const addEmail = () => setEmails(prev => [...prev, { id: null, coordinate: '' }])
  const removeEmail = (idx: number) => setEmails(prev => prev.filter((_, i) => i !== idx))
  const updateEmail = (idx: number, value: string) =>
    setEmails(prev => prev.map((e, i) => i === idx ? { ...e, coordinate: value } : e))

  // Phone helpers
  const addPhone = () => setPhones(prev => [...prev, { id: null, coordinate: '' }])
  const removePhone = (idx: number) => setPhones(prev => prev.filter((_, i) => i !== idx))
  const updatePhone = (idx: number, value: string) =>
    setPhones(prev => prev.map((p, i) => i === idx ? { ...p, coordinate: value } : p))

  // Mail address helpers
  const addMail = () => setMails(prev => [...prev, { id: null, mail_line_4: '', mail_line_6: '', mail_country: '' }])
  const removeMail = (idx: number) => setMails(prev => prev.filter((_, i) => i !== idx))
  const updateMail = (idx: number, patch: Partial<EntiteMail>) =>
    setMails(prev => prev.map((m, i) => i === idx ? { ...m, ...patch } : m))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const fd = new FormData()
    fd.append('entity[nature]', nature)
    fd.append('entity[title]', title)
    fd.append('entity[first_name]', firstName)
    fd.append('entity[last_name]', lastName)
    if (bornAt) fd.append('entity[born_at]', bornAt)
    if (deadAt) fd.append('entity[dead_at]', deadAt)
    fd.append('entity[language]', language)
    fd.append('entity[description]', description)
    emails.forEach((em, i) => {
      if (em.id !== null) fd.append(`entity[emails_attributes][${i}][id]`, String(em.id))
      fd.append(`entity[emails_attributes][${i}][coordinate]`, em.coordinate)
    })
    phones.forEach((p, i) => {
      if (p.id !== null) fd.append(`entity[phones_attributes][${i}][id]`, String(p.id))
      fd.append(`entity[phones_attributes][${i}][coordinate]`, p.coordinate)
    })
    mails.forEach((m, i) => {
      if (m.id !== null) fd.append(`entity[mails_attributes][${i}][id]`, String(m.id))
      fd.append(`entity[mails_attributes][${i}][mail_line_4]`, m.mail_line_4)
      fd.append(`entity[mails_attributes][${i}][mail_line_6]`, m.mail_line_6)
      fd.append(`entity[mails_attributes][${i}][mail_country]`, m.mail_country)
    })
    if (isEdit) {
      router.patch(`/backend/entities/${entite!.id}`, fd, { onFinish: () => setSubmitting(false) })
    } else {
      router.post('/backend/entities', fd, { onFinish: () => setSubmitting(false) })
    }
  }

  return (
    <>
      {/* Back link */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href="/backend/entities"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Liste des entités
        </a>
      </div>

      {/* Icon header + Title */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="flex items-center justify-center rounded-lg w-12 h-12 shrink-0"
          style={{ background: 'var(--color-primary-bg)' }}
        >
          <Users size={22} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            {isEdit ? "Modifier l'entité" : 'Nouvelle entité'}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {isEdit
              ? "Modifiez les informations de l'entité."
              : "Renseignez les informations de l'entité à créer."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Section 1 — Identité */}
        <div className="rounded-lg p-6 mb-5" style={cardStyle}>
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-5 flex items-center gap-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <User size={14} /> Identité
          </h2>

          <div className="flex flex-col gap-5">
            {/* Nature */}
            <div>
              <label
                htmlFor="ent-nature"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Nature
              </label>
              <select
                id="ent-nature"
                value={nature}
                onChange={(e) => setNature(e.target.value)}
                aria-invalid={!!errors.nature || undefined}
                aria-describedby={errors.nature ? 'ent-nature-error' : undefined}
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
              >
                <option value="organization">Organisation</option>
                <option value="contact">Contact</option>
              </select>
              {errors.nature && (
                <p id="ent-nature-error" style={errorStyle}>
                  {errors.nature}
                </p>
              )}
            </div>

            {/* Titre / Civilité */}
            <div>
              <label
                htmlFor="ent-title"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Titre
              </label>
              <select
                id="ent-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
              >
                <option value="">— Aucun —</option>
                <option value="M.">M.</option>
                <option value="Mme.">Mme.</option>
                <option value="Dr.">Dr.</option>
                <option value="Prof.">Prof.</option>
              </select>
            </div>

            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="ent-firstname"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Prénom
                </label>
                <input
                  id="ent-firstname"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  aria-invalid={!!errors.first_name || undefined}
                  aria-describedby={errors.first_name ? 'ent-firstname-error' : undefined}
                  className="w-full rounded px-3 py-2 text-sm"
                  style={inputStyle}
                  placeholder="ex. Mamadou"
                />
                {errors.first_name && (
                  <p id="ent-firstname-error" style={errorStyle}>
                    {errors.first_name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="ent-lastname"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Nom <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="ent-lastname"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  aria-invalid={!!errors.last_name || undefined}
                  aria-describedby={errors.last_name ? 'ent-lastname-error' : undefined}
                  className="w-full rounded px-3 py-2 text-sm"
                  style={inputStyle}
                  placeholder="ex. Diallo"
                />
                {errors.last_name && (
                  <p id="ent-lastname-error" style={errorStyle}>
                    {errors.last_name}
                  </p>
                )}
              </div>
            </div>

            {/* Langue */}
            <div>
              <label
                htmlFor="ent-language"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Langue
              </label>
              <select
                id="ent-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
              >
                <option value="fra">Français</option>
                <option value="eng">English</option>
                <option value="ara">العربية</option>
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="ent-born"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Date de naissance
                </label>
                <input
                  id="ent-born"
                  type="date"
                  value={bornAt}
                  onChange={(e) => setBornAt(e.target.value)}
                  className="w-full rounded px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="ent-dead"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  Date de décès
                </label>
                <input
                  id="ent-dead"
                  type="date"
                  value={deadAt}
                  onChange={(e) => setDeadAt(e.target.value)}
                  className="w-full rounded px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="ent-desc"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Description
              </label>
              <textarea
                id="ent-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded px-3 py-2 text-sm"
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="Description facultative…"
              />
            </div>
          </div>
        </div>

        {/* Section 2 — Emails */}
        <div className="rounded-lg p-6 mb-5" style={cardStyle}>
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-5 flex items-center gap-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Mail size={14} /> Emails
          </h2>

          <div className="flex flex-col gap-3">
            {emails.map((em, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="email"
                  value={em.coordinate}
                  onChange={(e) => updateEmail(idx, e.target.value)}
                  className="flex-1 rounded px-3 py-2 text-sm"
                  style={inputStyle}
                  placeholder="ex. contact@ferme.sn"
                  aria-label={`Email ${idx + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeEmail(idx)}
                  aria-label={`Supprimer email ${idx + 1}`}
                  className="flex items-center justify-center rounded p-1.5"
                  style={{
                    color: 'var(--color-danger)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addEmail}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium mt-4"
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            Ajouter un email
          </button>
        </div>

        {/* Section 3 — Téléphones */}
        <div className="rounded-lg p-6 mb-5" style={cardStyle}>
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-5 flex items-center gap-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Phone size={14} /> Téléphones
          </h2>

          <div className="flex flex-col gap-3">
            {phones.map((ph, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="tel"
                  value={ph.coordinate}
                  onChange={(e) => updatePhone(idx, e.target.value)}
                  className="flex-1 rounded px-3 py-2 text-sm"
                  style={inputStyle}
                  placeholder="ex. +221 77 000 0000"
                  aria-label={`Téléphone ${idx + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removePhone(idx)}
                  aria-label={`Supprimer téléphone ${idx + 1}`}
                  className="flex items-center justify-center rounded p-1.5"
                  style={{
                    color: 'var(--color-danger)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addPhone}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium mt-4"
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            Ajouter un téléphone
          </button>
        </div>

        {/* Section 4 — Adresses postales */}
        <div className="rounded-lg p-6 mb-5" style={cardStyle}>
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-5 flex items-center gap-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <MapPin size={14} /> Adresses postales
          </h2>

          <div className="flex flex-col gap-4">
            {mails.map((m, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={m.mail_line_4}
                    onChange={(e) => updateMail(idx, { mail_line_4: e.target.value })}
                    className="rounded px-3 py-2 text-sm"
                    style={inputStyle}
                    placeholder="Rue / BP"
                    aria-label={`Rue / BP adresse ${idx + 1}`}
                  />
                  <input
                    type="text"
                    value={m.mail_line_6}
                    onChange={(e) => updateMail(idx, { mail_line_6: e.target.value })}
                    className="rounded px-3 py-2 text-sm"
                    style={inputStyle}
                    placeholder="Ville / CP"
                    aria-label={`Ville / CP adresse ${idx + 1}`}
                  />
                  <input
                    type="text"
                    value={m.mail_country}
                    onChange={(e) => updateMail(idx, { mail_country: e.target.value })}
                    maxLength={2}
                    className="rounded px-3 py-2 text-sm"
                    style={inputStyle}
                    placeholder="Pays (ex. SN)"
                    aria-label={`Pays adresse ${idx + 1}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeMail(idx)}
                  aria-label={`Supprimer adresse ${idx + 1}`}
                  className="flex items-center justify-center rounded p-1.5 mt-1"
                  style={{
                    color: 'var(--color-danger)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addMail}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium mt-4"
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            Ajouter une adresse
          </button>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-3 pt-5"
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
            {isEdit ? 'Enregistrer' : "Créer l'entité"}
          </button>
          <a
            href="/backend/entities"
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
    </>
  )
}

EntitesForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default EntitesForm
