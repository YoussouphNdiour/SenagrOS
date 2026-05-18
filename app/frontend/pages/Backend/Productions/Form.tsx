import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Save, BarChart3 } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { ProductionFormProps } from '../../../types/production'

const errorStyle = { fontSize: '11px', color: 'var(--color-danger)', marginTop: '4px' }
const fieldStyle = {
  width: '100%', padding: '8px 12px', borderRadius: '6px',
  border: '1px solid var(--color-border)', background: 'var(--color-bg)',
  color: 'var(--color-text)', fontSize: '13px',
} as const

const STATE_OPTIONS = [
  { value: 'opened',   label: 'Ouverte' },
  { value: 'aborted',  label: 'Abandonnée' },
  { value: 'finished', label: 'Terminée' },
]

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
      <div className="flex items-center gap-3 mb-6">
        <a href="/backend/activity_productions" className="flex items-center gap-1 text-sm no-underline" style={{ color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={16} />
          Liste des productions
        </a>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center justify-center rounded-lg w-12 h-12 shrink-0" style={{ background: 'var(--color-success-bg)' }}>
          <BarChart3 size={22} style={{ color: 'var(--color-success-text)' }} />
        </div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
          {isEdit ? 'Modifier la production' : 'Nouvelle production'}
        </h1>
      </div>

      <div className="rounded-lg p-6" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">

            {/* Activité */}
            <div>
              <label htmlFor="prod-activity" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Activité <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select id="prod-activity" value={activityId} onChange={e => setActivityId(e.target.value)} required
                aria-invalid={!!errors.activity_id || undefined} aria-describedby={errors.activity_id ? 'prod-activity-error' : undefined}
                style={fieldStyle}>
                <option value="">— Choisir une activité —</option>
                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              {errors.activity_id && <p id="prod-activity-error" style={errorStyle}>{errors.activity_id}</p>}
            </div>

            {/* Campagne */}
            <div>
              <label htmlFor="prod-campaign" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Campagne <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select id="prod-campaign" value={campaignId} onChange={e => setCampaignId(e.target.value)} required
                aria-invalid={!!errors.campaign_id || undefined} aria-describedby={errors.campaign_id ? 'prod-campaign-error' : undefined}
                style={fieldStyle}>
                <option value="">— Choisir une campagne —</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.campaign_id && <p id="prod-campaign-error" style={errorStyle}>{errors.campaign_id}</p>}
            </div>

            {/* Parcelle */}
            <div>
              <label htmlFor="prod-zone" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Parcelle support
              </label>
              <select id="prod-zone" value={cultivableZoneId} onChange={e => setCultivableZoneId(e.target.value)}
                aria-invalid={!!errors.cultivable_zone_id || undefined} aria-describedby={errors.cultivable_zone_id ? 'prod-zone-error' : undefined}
                style={fieldStyle}>
                <option value="">— Aucune parcelle —</option>
                {cultivable_zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
              {errors.cultivable_zone_id && <p id="prod-zone-error" style={errorStyle}>{errors.cultivable_zone_id}</p>}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="prod-start" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                  Date de début <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input id="prod-start" type="date" value={startedOn} onChange={e => setStartedOn(e.target.value)} required
                  aria-invalid={!!errors.started_on || undefined} aria-describedby={errors.started_on ? 'prod-start-error' : undefined}
                  style={fieldStyle} />
                {errors.started_on && <p id="prod-start-error" style={errorStyle}>{errors.started_on}</p>}
              </div>
              <div>
                <label htmlFor="prod-stop" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Date de fin</label>
                <input id="prod-stop" type="date" value={stoppedOn} onChange={e => setStoppedOn(e.target.value)}
                  aria-invalid={!!errors.stopped_on || undefined} aria-describedby={errors.stopped_on ? 'prod-stop-error' : undefined}
                  style={fieldStyle} />
                {errors.stopped_on && <p id="prod-stop-error" style={errorStyle}>{errors.stopped_on}</p>}
              </div>
            </div>

            {/* État */}
            <div>
              <label htmlFor="prod-state" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>État</label>
              <select id="prod-state" value={state} onChange={e => setState(e.target.value)}
                aria-invalid={!!errors.state || undefined} aria-describedby={errors.state ? 'prod-state-error' : undefined}
                style={fieldStyle}>
                {STATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {errors.state && <p id="prod-state-error" style={errorStyle}>{errors.state}</p>}
            </div>

            {/* Checkboxes */}
            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <input id="prod-irrigated" type="checkbox" checked={irrigated} onChange={e => setIrrigated(e.target.checked)} />
                <label htmlFor="prod-irrigated" className="text-sm" style={{ color: 'var(--color-text)', cursor: 'pointer' }}>Irriguée</label>
              </div>
              <div className="flex items-center gap-2">
                <input id="prod-nitrate" type="checkbox" checked={nitrate} onChange={e => setNitrate(e.target.checked)} />
                <label htmlFor="prod-nitrate" className="text-sm" style={{ color: 'var(--color-text)', cursor: 'pointer' }}>Fixation d'azote</label>
              </div>
            </div>

          </div>

          <div className="flex items-center gap-3 mt-6 pt-5" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
              style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              <Save size={15} />
              {isEdit ? 'Enregistrer' : 'Créer la production'}
            </button>
            <a href="/backend/activity_productions" className="px-4 py-2 rounded text-sm font-medium no-underline"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
              Annuler
            </a>
          </div>
        </form>
      </div>
    </>
  )
}

ProductionsForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ProductionsForm
