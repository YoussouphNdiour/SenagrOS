'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { NdviWidget } from '@/components/maps/NdviWidget';
import {
  MapPin, Leaf, BarChart3, ClipboardList, AlertTriangle, CheckCircle2,
  RefreshCw, XCircle, MinusCircle, Info, ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

type Tab = 'info' | 'ndvi' | 'history' | 'logs' | 'rotation';

const LOG_TYPE_LABELS: Record<string, string> = {
  seeding: 'Semis',
  harvest: 'Récolte',
  input: 'Intrant',
  activity: 'Activité',
  observation: 'Observation',
  irrigation: 'Irrigation',
  transplanting: 'Repiquage',
  maintenance: 'Entretien',
};

const COMPAT_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  recommended: { icon: CheckCircle2, color: 'text-green-700', bg: 'bg-green-50 border-green-200', label: 'Recommandé' },
  neutral:     { icon: MinusCircle,  color: 'text-gray-600',  bg: 'bg-gray-50 border-gray-200',   label: 'Neutre' },
  avoid:       { icon: AlertTriangle, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', label: 'À éviter' },
  forbidden:   { icon: XCircle,      color: 'text-red-700',   bg: 'bg-red-50 border-red-200',     label: 'Interdit' },
};

export function ParcelDetailClient({ parcelId }: { parcelId: string }) {
  const [tab, setTab] = useState<Tab>('info');

  const { data: parcel, isLoading: parcelLoading } = trpc.parcel.getDetail.useQuery({ id: parcelId });
  const { data: cropHistory } = trpc.parcel.getCropHistory.useQuery({ parcelId });
  const { data: relatedLogs } = trpc.parcel.getRelatedLogs.useQuery({ parcelId });
  const { data: inputAlerts } = trpc.parcel.getInputAlerts.useQuery({ parcelId });
  const { data: rotation } = trpc.parcel.getRotationRecommendations.useQuery({ parcelId });

  if (parcelLoading || !parcel) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  const data = (parcel.data ?? {}) as Record<string, unknown>;
  const activeAlerts = inputAlerts?.filter(Boolean) ?? [];

  const TABS: { key: Tab; label: string; icon: typeof MapPin }[] = [
    { key: 'info',     label: 'Infos',    icon: MapPin },
    { key: 'ndvi',     label: 'NDVI',     icon: Leaf },
    { key: 'history',  label: 'Cultures', icon: RefreshCw },
    { key: 'logs',     label: 'Activités', icon: ClipboardList },
    { key: 'rotation', label: 'Rotation', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/assets/land" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 transition">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">{parcel.name}</h1>
            <Badge variant={parcel.status === 'active' ? 'success' : 'default'}>{parcel.status ?? '—'}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">
            {data.surface_ha ? `${data.surface_ha} ha` : 'Surface non renseignée'}
            {data.soil_type ? ` · Sol : ${data.soil_type}` : ''}
          </p>
        </div>
        {/* Input alert indicator */}
        {activeAlerts.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700">
            <AlertTriangle className="h-4 w-4" />
            {activeAlerts.length} alerte{activeAlerts.length > 1 ? 's' : ''} intrant
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 pb-0">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                tab === t.key
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── INFO ── */}
      {tab === 'info' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-gray-600">Caractéristiques</h2>
            <dl className="space-y-2 text-sm">
              {[
                ['Surface', data.surface_ha ? `${data.surface_ha} ha` : '—'],
                ['Type de sol', data.soil_type ?? '—'],
                ['Irrigation', data.irrigation_type ?? '—'],
                ['Statut', parcel.status ?? '—'],
                ['Créée le', parcel.createdAt ? new Date(parcel.createdAt).toLocaleDateString('fr-FR') : '—'],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between">
                  <dt className="text-gray-500">{String(k)}</dt>
                  <dd className="font-medium text-gray-800">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-gray-600">Culture en cours</h2>
            {cropHistory && cropHistory[0] && cropHistory[0].status === 'active' ? (
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-green-700 text-base">{cropHistory[0].cropType}</p>
                {cropHistory[0].variety && <p className="text-gray-500">Variété : {cropHistory[0].variety}</p>}
                <p className="text-gray-500">Semis : {cropHistory[0].sowingDate}</p>
                {cropHistory[0].expectedHarvestDate && (
                  <p className="text-gray-500">Récolte prévue : {cropHistory[0].expectedHarvestDate}</p>
                )}
                {cropHistory[0].expectedYieldKgHa && (
                  <p className="text-gray-500">Objectif : {cropHistory[0].expectedYieldKgHa} kg/ha</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucune culture active</p>
            )}

            {activeAlerts.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Alertes intrants</p>
                {activeAlerts.map((alert) => alert && (
                  <div key={alert.logId} className="flex items-start gap-2 rounded-lg bg-orange-50 p-2 text-xs">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
                    <div>
                      <span className="font-medium text-orange-800">{alert.productName}</span>
                      <span className="text-orange-600"> — délai de carence : {alert.daysLeft}j restants</span>
                      <span className="block text-orange-500">Fin : {alert.withdrawalEndsAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {parcel.notes && (
            <Card className="sm:col-span-2">
              <h2 className="mb-2 text-sm font-semibold text-gray-600">Notes</h2>
              <p className="text-sm text-gray-700">{parcel.notes}</p>
            </Card>
          )}
        </div>
      )}

      {/* ── NDVI ── */}
      {tab === 'ndvi' && (
        <Card>
          <NdviWidget assetId={parcelId} parcelName={parcel.name} />
          {!parcel.geojson && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Cette parcelle n'a pas encore de géométrie dessinée. Les données NDVI réelles (Sentinel-2)
                nécessitent un contour GPS.{' '}
                <Link href="/map" className="underline font-medium">Dessiner sur la carte →</Link>
              </p>
            </div>
          )}
        </Card>
      )}

      {/* ── CROP HISTORY ── */}
      {tab === 'history' && (
        <div className="space-y-4">
          {!cropHistory || cropHistory.length === 0 ? (
            <Card>
              <div className="py-8 text-center text-gray-400">
                <RefreshCw className="mx-auto mb-3 h-8 w-8 opacity-30" />
                <p className="font-medium">Aucun historique cultural</p>
                <p className="mt-1 text-sm">
                  Assignez un calendrier à cette parcelle depuis{' '}
                  <Link href="/calendrier" className="text-green-600 underline">les Calendriers</Link>
                </p>
              </div>
            </Card>
          ) : (
            <div className="relative">
              {/* Timeline */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4 pl-10">
                {cropHistory.map((c, i) => (
                  <div key={c.id} className="relative">
                    <div className={`absolute -left-[26px] top-2 h-4 w-4 rounded-full border-2 border-white shadow ${
                      c.status === 'active' ? 'bg-green-500' : c.status === 'completed' ? 'bg-blue-400' : 'bg-gray-300'
                    }`} />
                    <Card>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">{c.cropType}</span>
                            {c.variety && <span className="text-sm text-gray-500">({c.variety})</span>}
                            <Badge variant={c.status === 'active' ? 'success' : c.status === 'completed' ? 'info' : 'default'}>
                              {c.status === 'active' ? 'Actif' : c.status === 'completed' ? 'Terminé' : c.status ?? '—'}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            Semis : {c.sowingDate}
                            {c.actualHarvestDate && ` · Récolte : ${c.actualHarvestDate}`}
                            {c.expectedHarvestDate && !c.actualHarvestDate && ` · Prévue : ${c.expectedHarvestDate}`}
                          </p>
                        </div>
                        {c.expectedYieldKgHa && (
                          <span className="text-sm font-medium text-blue-700">{c.expectedYieldKgHa} kg/ha prévu</span>
                        )}
                      </div>
                      {c.notes && <p className="mt-2 text-xs text-gray-400 italic">{c.notes}</p>}
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LOGS ── */}
      {tab === 'logs' && (
        <div className="space-y-3">
          {!relatedLogs || relatedLogs.length === 0 ? (
            <Card>
              <div className="py-8 text-center text-gray-400">
                <ClipboardList className="mx-auto mb-3 h-8 w-8 opacity-30" />
                <p>Aucune activité liée à cette parcelle</p>
              </div>
            </Card>
          ) : (
            relatedLogs.map((log) => {
              const logData = (log.data ?? {}) as Record<string, unknown>;
              return (
                <div key={log.id} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 text-xs font-bold">
                    {(LOG_TYPE_LABELS[log.type] ?? log.type).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-800">{log.name}</span>
                      <Badge variant="default">{LOG_TYPE_LABELS[log.type] ?? log.type}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {log.status ? ` · ${log.status}` : ''}
                    </p>
                    {log.notes && <p className="mt-1 text-xs text-gray-500 italic">{log.notes}</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── ROTATION ── */}
      {tab === 'rotation' && (
        <div className="space-y-4">
          {rotation?.lastCrop ? (
            <Card>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Dernière culture</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-800">{rotation.lastCrop.cropType}</span>
                {rotation.lastCrop.variety && <span className="text-sm text-gray-500">({rotation.lastCrop.variety})</span>}
                {rotation.lastCrop.code && <Badge variant="info">{rotation.lastCrop.code}</Badge>}
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-sm text-gray-400 italic">Aucune culture enregistrée — les recommandations apparaîtront après votre première saison.</p>
            </Card>
          )}

          {rotation?.recommendations && rotation.recommendations.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-700">Cultures suivantes recommandées</h2>
              <div className="space-y-2">
                {rotation.recommendations.map((r) => {
                  const cfg = COMPAT_CONFIG[r.compatibility] ?? COMPAT_CONFIG.neutral;
                  const Icon = cfg.icon;
                  return (
                    <div key={r.id} className={`flex items-start gap-3 rounded-xl border p-3 ${cfg.bg}`}>
                      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.color}`} />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`font-semibold ${cfg.color}`}>{r.nextCropName}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border`}>{cfg.label}</span>
                        </div>
                        {r.reason && <p className="mt-1 text-sm text-gray-600">{r.reason}</p>}
                        {r.recommendation && <p className="mt-0.5 text-xs text-gray-500 italic">{r.recommendation}</p>}
                        {r.minIntervalDays && r.minIntervalDays > 0 && (
                          <p className="mt-1 text-xs text-gray-400">
                            Délai minimum : {Math.round(r.minIntervalDays / 30)} mois
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {rotation?.recommendations && rotation.recommendations.length === 0 && rotation.lastCrop && (
            <Card>
              <p className="text-sm text-gray-500">Aucune règle de rotation définie pour <strong>{rotation.lastCrop.cropType}</strong>.</p>
              <p className="mt-1 text-xs text-gray-400">
                Vous pouvez ajouter des règles personnalisées depuis{' '}
                <Link href="/parametres" className="text-green-600 underline">Paramètres</Link>.
              </p>
            </Card>
          )}

          {/* All available crops */}
          {rotation?.allCrops && rotation.allCrops.length > 0 && (
            <Card>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Cultures disponibles dans le système</h3>
              <div className="flex flex-wrap gap-2">
                {rotation.allCrops.map((c) => (
                  <span key={c.id} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700">
                    {c.nameFr}
                    {c.cycleShortDays ? ` (${c.cycleShortDays}–${c.cycleShortDays + 30}j)` : ''}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
