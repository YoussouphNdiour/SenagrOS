'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  formTypeLabels,
  defectTypeLabels,
} from '@/lib/validators/observation.validator';

interface ObservationDetailClientProps {
  id: string;
}

type FormData = Record<string, unknown>;

interface ObservationData {
  id: string;
  logId: string;
  formType: string;
  assetId: string;
  cropType: string | null;
  variety: string | null;
  observerId: string;
  supervisorId: string | null;
  observationDate: string;
  startTime: string | null;
  endTime: string | null;
  observedSurfaceHa: string | null;
  formData: FormData;
  calculated: Record<string, number> | null;
  observerRemarks: string | null;
  supervisorRemarks: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  assetName: string;
  observerName: string;
}

export function ObservationDetailClient({ id }: ObservationDetailClientProps) {
  const router = useRouter();
  const { data: rawData, isLoading } = trpc.observation.getById.useQuery({ id });
  const deleteMutation = trpc.observation.delete.useMutation({
    onSuccess: () => router.push('/observations'),
  });

  if (isLoading || !rawData) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
      </div>
    );
  }

  const data = rawData as unknown as ObservationData;
  const formData = data.formData;
  const calculated = data.calculated;
  const remarks = {
    observer: data.observerRemarks,
    supervisor: data.supervisorRemarks,
  };

  const formTypeBadgeVariant: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
    emergence_density: 'success',
    cultural_stage: 'info',
    pest_disease: 'warning',
    pre_harvest_grading: 'danger',
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">
            {formTypeLabels[data.formType] ?? data.formType}
          </h1>
          <Badge variant={formTypeBadgeVariant[data.formType] ?? 'info'}>
            {formTypeLabels[data.formType] ?? data.formType}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/observations')}>
            Retour
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm('Supprimer cette observation ?')) {
                deleteMutation.mutate({ id });
              }
            }}
          >
            Supprimer
          </Button>
        </div>
      </div>

      {/* Info cards */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-700">Informations générales</h2>
          <dl className="space-y-3">
            <InfoRow label="Parcelle" value={data.assetName} />
            <InfoRow label="Culture" value={data.cropType} />
            <InfoRow label="Variété" value={data.variety} />
            <InfoRow
              label="Date observation"
              value={new Date(data.observationDate).toLocaleDateString('fr-FR')}
            />
            <InfoRow label="Heure début" value={data.startTime} />
            <InfoRow label="Heure fin" value={data.endTime} />
            <InfoRow
              label="Surface observée"
              value={data.observedSurfaceHa ? `${String(data.observedSurfaceHa)} ha` : undefined}
            />
            <InfoRow label="Observateur" value={data.observerName} />
          </dl>
        </Card>

        {/* Results card */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-700">Résultats calculés</h2>
          {data.formType === 'emergence_density' && (
            <DensityResults formData={formData} calculated={calculated} />
          )}
          {data.formType === 'cultural_stage' && (
            <StageResults formData={formData} />
          )}
          {data.formType === 'pest_disease' && (
            <PestResults formData={formData} />
          )}
          {data.formType === 'pre_harvest_grading' && (
            <GradingResults formData={formData} />
          )}
        </Card>
      </div>

      {/* Remarks */}
      {(remarks.observer || remarks.supervisor) && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-700">Remarques</h2>
          {remarks.observer && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-500">Observateur</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{remarks.observer}</p>
            </div>
          )}
          {remarks.supervisor && (
            <div>
              <p className="text-sm font-medium text-gray-500">Chef de ferme</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{remarks.supervisor}</p>
            </div>
          )}
        </Card>
      )}

      {/* Raw data for density: repetitions table */}
      {data.formType === 'emergence_density' && Boolean(formData.repetitions) && (
        <Card className="mt-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">Données de comptage</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Rép.</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Plants</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Rép.</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Plants</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const reps = formData.repetitions as { rep: number; plant_count: number }[];
                  const rows = [];
                  for (let i = 0; i < reps.length; i += 2) {
                    rows.push(
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-4 py-2 font-medium">{reps[i].rep}</td>
                        <td className="px-4 py-2">{reps[i].plant_count}</td>
                        {reps[i + 1] ? (
                          <>
                            <td className="px-4 py-2 font-medium">{reps[i + 1].rep}</td>
                            <td className="px-4 py-2">{reps[i + 1].plant_count}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-2" />
                            <td className="px-4 py-2" />
                          </>
                        )}
                      </tr>,
                    );
                  }
                  return rows;
                })()}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Raw data for pest_disease: observation grid */}
      {data.formType === 'pest_disease' && Boolean(formData.observations) && (
        <Card className="mt-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">Grille d'observation</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Ravageur/Maladie</th>
                  {Array.from({ length: (formData.num_targets as number) ?? 10 }).map((_, i) => (
                    <th key={i} className="px-2 py-2 text-center font-medium text-gray-600">
                      B{i + 1}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center font-medium text-gray-600">Total</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">%</th>
                </tr>
              </thead>
              <tbody>
                {(
                  formData.observations as {
                    pest_or_disease: string;
                    targets: number[];
                    total: number;
                    pct_infested: number;
                  }[]
                ).map((obs, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="px-3 py-1.5 font-medium whitespace-nowrap">{obs.pest_or_disease}</td>
                    {obs.targets.map((t, ti) => (
                      <td key={ti} className="px-2 py-1.5 text-center">
                        {t > 0 ? <span className="font-bold text-red-600">{t}</span> : '·'}
                      </td>
                    ))}
                    <td className="px-3 py-1.5 text-center font-bold">{obs.total}</td>
                    <td
                      className={`px-3 py-1.5 text-center font-bold ${
                        obs.pct_infested > (formData.treatment_threshold as number ?? 5)
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {obs.pct_infested}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex justify-between">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-800">{value}</dd>
    </div>
  );
}

function DensityResults({
  formData,
  calculated,
}: {
  formData: FormData;
  calculated: Record<string, number> | null;
}) {
  return (
    <div className="space-y-4">
      <ResultValue
        label="Total plants"
        value={calculated?.total_plants ?? 0}
        unit="plants"
      />
      <ResultValue
        label="Densité réelle"
        value={calculated?.real_density_per_ha ?? 0}
        unit="plts/ha"
        highlight
      />
      <ResultValue
        label="Taux de levée"
        value={`${calculated?.emergence_rate_pct ?? 0}%`}
        highlight
      />
      <div className="text-xs text-gray-400">
        Densité théorique : {String(formData.theoretical_density ?? '—')} plts/ha | Surface
        échantillon : {String(formData.sample_area_m2 ?? 1)} m² | Répétitions :{' '}
        {String(formData.num_repetitions ?? '—')}
      </div>
    </div>
  );
}

function StageResults({ formData }: { formData: FormData }) {
  return (
    <div className="space-y-4">
      <ResultValue
        label="Stade atteint"
        value={(formData.stage_reached as string) ?? '—'}
        highlight
      />
      <ResultValue
        label="Date atteinte"
        value={
          formData.date_reached
            ? new Date(formData.date_reached as string).toLocaleDateString('fr-FR')
            : '—'
        }
      />
    </div>
  );
}

function PestResults({ formData }: { formData: FormData }) {
  const observations = (formData.observations ?? []) as {
    pest_or_disease: string;
    pct_infested: number;
  }[];
  const threshold = (formData.treatment_threshold as number) ?? 5;
  const alerts = observations.filter((o) => o.pct_infested > threshold);

  return (
    <div className="space-y-4">
      <ResultValue label="Cibles observées" value={(formData.num_targets as number) ?? 10} />
      <ResultValue label="Seuil traitement" value={`${threshold}%`} />
      {alerts.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-red-600">
            {alerts.length} alerte{alerts.length > 1 ? 's' : ''} :
          </p>
          <ul className="space-y-1">
            {alerts.map((a, i) => (
              <li key={i} className="text-sm text-red-600">
                • {a.pest_or_disease} — {a.pct_infested}%
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm font-medium text-green-600">Aucune alerte</p>
      )}
    </div>
  );
}

function GradingResults({ formData }: { formData: FormData }) {
  const totalLengths = formData.total_lengths as { total: number } | undefined;
  const marketableLengths = formData.marketable_lengths as { total: number } | undefined;
  const maturity = formData.maturity_index as { maturity_pct: number } | undefined;

  return (
    <div className="space-y-4">
      <ResultValue
        label="Échantillon"
        value={`${(formData.sample_size as number) ?? 20} épis`}
      />
      <ResultValue
        label="Total"
        value={totalLengths?.total ?? 0}
        unit="épis"
      />
      <ResultValue
        label="Valorisables"
        value={marketableLengths?.total ?? 0}
        unit="épis"
      />
      <ResultValue
        label="% Valorisable"
        value={`${(formData.marketable_pct as number) ?? 0}%`}
        highlight
      />
      <ResultValue
        label="% Défauts"
        value={`${(formData.total_defects_pct as number) ?? 0}%`}
      />
      <ResultValue
        label="% Maturité"
        value={`${maturity?.maturity_pct ?? 0}%`}
        highlight
      />
      {formData.estimated_yield_per_ha != null && (
        <ResultValue
          label="Rendement prévisionnel"
          value={`${String(formData.estimated_yield_per_ha)} épis/ha`}
        />
      )}
      {formData.estimated_harvest_date != null && (
        <ResultValue
          label="Date prévisionnelle récolte"
          value={new Date(formData.estimated_harvest_date as string).toLocaleDateString('fr-FR')}
        />
      )}
    </div>
  );
}

function ResultValue({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-sm font-bold ${highlight ? 'text-green-700' : 'text-gray-800'}`}
      >
        {value}
        {unit ? ` ${unit}` : ''}
      </span>
    </div>
  );
}
