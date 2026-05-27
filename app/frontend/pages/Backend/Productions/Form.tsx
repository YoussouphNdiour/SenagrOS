import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Save, BarChart3 } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, IconBox, SectionCard, SectionTitle, FormField, PrimaryButton, FlashBanner } from '../../../components/ui'
import type { ProductionFormProps } from '../../../types/production'

const STATE_OPTIONS = [
  { value: 'opened',   label: 'Ouverte' },
  { value: 'aborted',  label: 'Abandonnée' },
  { value: 'finished', label: 'Terminée' },
]

const normalizeError = (e: string | string[] | undefined): string | undefined =>
  Array.isArray(e) ? e[0] : e

const ProductionsForm = ({ production, activities, campaigns, cultivable_zones, errors }: ProductionFormProps) => {
  const isEdit = production !== null

  const [activityId,       setActivityId]       = useState<string>(production?.activity_id?.toString()        ?? '')
  const [campaignId,       setCampaignId]       = useState<string>(production?.campaign_id?.toString()        ?? '')
  const [cultivableZoneId, setCultivableZoneId] = useState<string>(production?.cultivable_zone_id?.toString() ?? '')
  const [startedOn,        setStartedOn]        = useState<string>(production?.started_on                     ?? '')
  const [stoppedOn,        setStoppedOn]        = useState<string>(production?.stopped_on                     ?? '')
  const [irrigated,        setIrrigated]        = useState<boolean>(production?.irrigated                     ?? false)
  const [nitrate,          setNitrate]          = useState<boolean>(production?.nitrate_fixing                ?? false)
  const [state,            setState]            = useState<string>(production?.state                          ?? 'opened')
  const [submitting,       setSubmitting]       = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const data = {
      production: {
        activity_id:        activityId || null,
        campaign_id:        campaignId || null,
        cultivable_zone_id: cultivableZoneId || null,
        started_on:         startedOn || null,
        stopped_on:         stoppedOn || null,
        irrigated,
        nitrate_fixing:     nitrate,
        state,
      },
    }
    if (isEdit) {
      router.patch(`/backend/activity_productions/${production.id}`, data, { onFinish: () => setSubmitting(false) })
    } else {
      router.post('/backend/activity_productions', data, { onFinish: () => setSubmitting(false) })
    }
  }

  return (
    <>
      <BackLink href="/backend/activity_productions" label="Liste des productions" />

      <div className="flex items-center gap-4 mb-6">
        <IconBox icon={BarChart3} color="var(--color-success-text)" bg="var(--color-success-bg)" />
        <div>
          <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {isEdit ? 'Modifier la production' : 'Nouvelle production'}
          </h1>
          <p className="mt-1 text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
            {isEdit ? 'Modifiez les informations de la production.' : 'Renseignez les informations de la production à créer.'}
          </p>
        </div>
      </div>

      <SectionCard>
        <SectionTitle icon={BarChart3}>Informations de la production</SectionTitle>
        <FlashBanner errors={errors} />
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">
            <FormField label="Activité" required htmlFor="prod-activity" error={normalizeError(errors.activity_id)}>
              <select id="prod-activity" value={activityId} onChange={e => setActivityId(e.target.value)} required
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                <option value="">— Choisir une activité —</option>
                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </FormField>

            <FormField label="Campagne" required htmlFor="prod-campaign" error={normalizeError(errors.campaign_id)}>
              <select id="prod-campaign" value={campaignId} onChange={e => setCampaignId(e.target.value)} required
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                <option value="">— Choisir une campagne —</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>

            <FormField label="Parcelle support" htmlFor="prod-zone" error={normalizeError(errors.cultivable_zone_id)}>
              <select id="prod-zone" value={cultivableZoneId} onChange={e => setCultivableZoneId(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                <option value="">— Aucune parcelle —</option>
                {cultivable_zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date de début" required htmlFor="prod-start" error={normalizeError(errors.started_on)}>
                <input id="prod-start" type="date" value={startedOn} onChange={e => setStartedOn(e.target.value)} required
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
              <FormField label="Date de fin" htmlFor="prod-stop" error={normalizeError(errors.stopped_on)}>
                <input id="prod-stop" type="date" value={stoppedOn} onChange={e => setStoppedOn(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </FormField>
            </div>

            <FormField label="État" htmlFor="prod-state" error={normalizeError(errors.state)}>
              <select id="prod-state" value={state} onChange={e => setState(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                {STATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>

            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <input id="prod-irrigated" type="checkbox" checked={irrigated} onChange={e => setIrrigated(e.target.checked)} />
                <label htmlFor="prod-irrigated" className="text-sm cursor-pointer" style={{ color: 'var(--color-text)' }}>Irriguée</label>
              </div>
              <div className="flex items-center gap-2">
                <input id="prod-nitrate" type="checkbox" checked={nitrate} onChange={e => setNitrate(e.target.checked)} />
                <label htmlFor="prod-nitrate" className="text-sm cursor-pointer" style={{ color: 'var(--color-text)' }}>Fixation d'azote</label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <PrimaryButton type="submit" disabled={submitting}>
              <Save size={15} /> {isEdit ? 'Enregistrer' : 'Créer la production'}
            </PrimaryButton>
            <PrimaryButton href="/backend/activity_productions" variant="secondary">Annuler</PrimaryButton>
          </div>
        </form>
      </SectionCard>
    </>
  )
}

ProductionsForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ProductionsForm
