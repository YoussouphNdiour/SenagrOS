import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Mail, MapPin, Phone, Plus, Save, User, Users, X } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, IconBox, SectionCard, SectionTitle, FormField, PrimaryButton } from '../../../components/ui'
import type { EntiteEmail, EntiteFormProps, EntiteMail, EntitePhone } from '../../../types/entite'

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

  const addEmail = () => setEmails(prev => [...prev, { id: null, coordinate: '' }])
  const removeEmail = (idx: number) => setEmails(prev => prev.filter((_, i) => i !== idx))
  const updateEmail = (idx: number, value: string) =>
    setEmails(prev => prev.map((e, i) => i === idx ? { ...e, coordinate: value } : e))

  const addPhone = () => setPhones(prev => [...prev, { id: null, coordinate: '' }])
  const removePhone = (idx: number) => setPhones(prev => prev.filter((_, i) => i !== idx))
  const updatePhone = (idx: number, value: string) =>
    setPhones(prev => prev.map((p, i) => i === idx ? { ...p, coordinate: value } : p))

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
      <BackLink href="/backend/entities" label="Liste des entités" />

      <div className="flex items-center gap-4 mb-6">
        <IconBox icon={Users} color="var(--color-primary)" bg="var(--color-primary-bg)" />
        <div>
          <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {isEdit ? "Modifier l'entité" : 'Nouvelle entité'}
          </h1>
          <p className="mt-1 text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
            {isEdit ? "Modifiez les informations de l'entité." : "Renseignez les informations de l'entité à créer."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <SectionCard className="mb-5">
          <SectionTitle icon={User}>Identité</SectionTitle>

          <div className="flex flex-col gap-5">
            <FormField label="Nature" htmlFor="ent-nature" error={errors.nature}>
              <select id="ent-nature" value={nature} onChange={e => setNature(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                <option value="organization">Organisation</option>
                <option value="contact">Contact</option>
              </select>
            </FormField>

            <FormField label="Titre" htmlFor="ent-title">
              <select id="ent-title" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                <option value="">— Aucun —</option>
                <option value="M.">M.</option>
                <option value="Mme.">Mme.</option>
                <option value="Dr.">Dr.</option>
                <option value="Prof.">Prof.</option>
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Prénom" htmlFor="ent-firstname" error={errors.first_name}>
                <input id="ent-firstname" type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                  placeholder="ex. Mamadou" />
              </FormField>
              <FormField label="Nom" required htmlFor="ent-lastname" error={errors.last_name}>
                <input id="ent-lastname" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                  placeholder="ex. Diallo" />
              </FormField>
            </div>

            <FormField label="Langue" htmlFor="ent-language">
              <select id="ent-language" value={language} onChange={e => setLanguage(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                <option value="fra">Français</option>
                <option value="eng">English</option>
                <option value="ara">العربية</option>
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date de naissance" htmlFor="ent-born">
                <input id="ent-born" type="date" value={bornAt} onChange={e => setBornAt(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
              <FormField label="Date de décès" htmlFor="ent-dead">
                <input id="ent-dead" type="date" value={deadAt} onChange={e => setDeadAt(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
            </div>

            <FormField label="Description" htmlFor="ent-desc">
              <textarea id="ent-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="Description facultative…" />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard className="mb-5">
          <SectionTitle icon={Mail}>Emails</SectionTitle>

          <div className="flex flex-col gap-3">
            {emails.map((em, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input type="email" value={em.coordinate} onChange={e => updateEmail(idx, e.target.value)}
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                  placeholder="ex. contact@ferme.sn" aria-label={`Email ${idx + 1}`} />
                <button type="button" onClick={() => removeEmail(idx)} aria-label={`Supprimer email ${idx + 1}`}
                  className="flex items-center justify-center rounded p-1.5 border-0 bg-transparent cursor-pointer"
                  style={{ color: 'var(--color-danger)' }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <PrimaryButton type="button" variant="secondary" size="sm" onClick={addEmail}>
              <Plus size={14} /> Ajouter un email
            </PrimaryButton>
          </div>
        </SectionCard>

        <SectionCard className="mb-5">
          <SectionTitle icon={Phone}>Téléphones</SectionTitle>

          <div className="flex flex-col gap-3">
            {phones.map((ph, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input type="tel" value={ph.coordinate} onChange={e => updatePhone(idx, e.target.value)}
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                  placeholder="ex. +221 77 000 0000" aria-label={`Téléphone ${idx + 1}`} />
                <button type="button" onClick={() => removePhone(idx)} aria-label={`Supprimer téléphone ${idx + 1}`}
                  className="flex items-center justify-center rounded p-1.5 border-0 bg-transparent cursor-pointer"
                  style={{ color: 'var(--color-danger)' }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <PrimaryButton type="button" variant="secondary" size="sm" onClick={addPhone}>
              <Plus size={14} /> Ajouter un téléphone
            </PrimaryButton>
          </div>
        </SectionCard>

        <SectionCard className="mb-5">
          <SectionTitle icon={MapPin}>Adresses postales</SectionTitle>

          <div className="flex flex-col gap-4">
            {mails.map((m, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <input type="text" value={m.mail_line_4} onChange={e => updateMail(idx, { mail_line_4: e.target.value })}
                    className="rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                    placeholder="Rue / BP" aria-label={`Rue / BP adresse ${idx + 1}`} />
                  <input type="text" value={m.mail_line_6} onChange={e => updateMail(idx, { mail_line_6: e.target.value })}
                    className="rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                    placeholder="Ville / CP" aria-label={`Ville / CP adresse ${idx + 1}`} />
                  <input type="text" value={m.mail_country} onChange={e => updateMail(idx, { mail_country: e.target.value })}
                    maxLength={2}
                    className="rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                    placeholder="Pays (ex. SN)" aria-label={`Pays adresse ${idx + 1}`} />
                </div>
                <button type="button" onClick={() => removeMail(idx)} aria-label={`Supprimer adresse ${idx + 1}`}
                  className="flex items-center justify-center rounded p-1.5 mt-1 border-0 bg-transparent cursor-pointer"
                  style={{ color: 'var(--color-danger)' }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <PrimaryButton type="button" variant="secondary" size="sm" onClick={addMail}>
              <Plus size={14} /> Ajouter une adresse
            </PrimaryButton>
          </div>
        </SectionCard>

        <div className="flex items-center gap-3 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <PrimaryButton type="submit" disabled={submitting}>
            <Save size={15} /> {isEdit ? 'Enregistrer' : "Créer l'entité"}
          </PrimaryButton>
          <PrimaryButton href="/backend/entities" variant="secondary">Annuler</PrimaryButton>
        </div>
      </form>
    </>
  )
}

EntitesForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default EntitesForm
