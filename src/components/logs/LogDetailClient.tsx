'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, CheckCircle, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { logTypeValues, logStatusValues } from '@/lib/validators/log.validator';

type LogType = (typeof logTypeValues)[number];
type LogStatus = (typeof logStatusValues)[number];

const typeLabels: Record<LogType, string> = {
  activity: 'Activite',
  observation: 'Observation',
  input: 'Intrant',
  harvest: 'Recolte',
  seeding: 'Semis',
  transplanting: 'Repiquage',
  birth: 'Naissance',
  maintenance: 'Maintenance',
  medical: 'Medical',
  lab_test: 'Analyse labo',
  movement: 'Mouvement',
  irrigation: 'Irrigation',
};

const statusLabels: Record<LogStatus, string> = {
  pending: 'En attente',
  done: 'Termine',
  cancelled: 'Annule',
};

const statusVariant: Record<LogStatus, 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  done: 'success',
  cancelled: 'danger',
};

const assetTypeLabels: Record<string, string> = {
  land: 'Parcelle',
  plant: 'Culture',
  animal: 'Animal',
  equipment: 'Equipement',
  structure: 'Structure',
  material: 'Intrant',
  sensor: 'Capteur',
  water: "Point d'eau",
  seed: 'Semence',
  product: 'Produit',
  compost: 'Compost',
  group: 'Groupe',
};

interface LogDetailClientProps {
  logId: string;
}

export function LogDetailClient({ logId }: LogDetailClientProps) {
  const router = useRouter();
  const { data: log, isLoading } = trpc.log.getById.useQuery({ id: logId });

  const completeMutation = trpc.log.complete.useMutation({
    onSuccess: () => router.refresh(),
  });

  const deleteMutation = trpc.log.delete.useMutation({
    onSuccess: () => router.push('/logs'),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Log introuvable
      </div>
    );
  }

  const dataEntries =
    log.data !== null &&
    log.data !== undefined &&
    typeof log.data === 'object' &&
    !Array.isArray(log.data)
      ? Object.entries(log.data as Record<string, unknown>).filter(
          ([, v]) => v !== null && v !== undefined && v !== '',
        )
      : [];

  const typeLabelDisplay =
    log.type in typeLabels
      ? typeLabels[log.type as LogType]
      : log.type;

  const statusLabelDisplay =
    log.status && log.status in statusLabels
      ? statusLabels[log.status as LogStatus]
      : (log.status ?? '—');

  const logStatus = log.status as LogStatus | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">{log.name}</h1>
              <Badge variant={logStatus ? statusVariant[logStatus] : 'default'}>
                {statusLabelDisplay}
              </Badge>
              <Badge variant="info">{typeLabelDisplay}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/logs/${log.id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
            Modifier
          </Button>
          {logStatus !== 'done' && (
            <Button
              variant="primary"
              onClick={() => completeMutation.mutate({ id: log.id })}
              disabled={completeMutation.isPending}
            >
              <CheckCircle className="h-4 w-4" />
              Terminer
            </Button>
          )}
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Supprimer ce log ?')) {
                deleteMutation.mutate({ id: log.id });
              }
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Main info */}
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">Informations</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Type</dt>
              <dd className="font-medium">{typeLabelDisplay}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Statut</dt>
              <dd className="font-medium">{statusLabelDisplay}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Date</dt>
              <dd className="font-medium">
                {log.timestamp
                  ? new Date(log.timestamp).toLocaleString('fr-FR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '—'}
              </dd>
            </div>
            {log.notes && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Notes</dt>
                <dd className="font-medium max-w-xs text-right">{log.notes}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* JSONB data fields */}
        {dataEntries.length > 0 && (
          <Card>
            <h3 className="mb-3 text-lg font-semibold text-gray-800">Donnees specifiques</h3>
            <dl className="space-y-2 text-sm">
              {dataEntries.map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                  <dd className="font-medium">
                    {typeof value === 'object'
                      ? JSON.stringify(value) as string
                      : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        )}
      </div>

      {/* Equipment IDs */}
      {(() => {
        const eqIds = Array.isArray(log.equipmentIds) ? (log.equipmentIds as string[]) : [];
        if (eqIds.length === 0) return null;
        return (
          <Card>
            <h3 className="mb-3 text-lg font-semibold text-gray-800">
              Equipements ({eqIds.length})
            </h3>
            <ul className="divide-y divide-gray-100">
              {eqIds.map((eqId) => (
                <li
                  key={eqId}
                  className="flex cursor-pointer items-center justify-between py-2 hover:bg-gray-50"
                  onClick={() => router.push(`/assets/${eqId}`)}
                >
                  <span className="font-medium text-gray-800 text-sm">{eqId}</span>
                  <Badge variant="info">Equipement</Badge>
                </li>
              ))}
            </ul>
          </Card>
        );
      })()}

      {/* Worker IDs */}
      {(() => {
        const wIds = Array.isArray(log.workerIds) ? (log.workerIds as string[]) : [];
        if (wIds.length === 0) return null;
        return (
          <Card>
            <h3 className="mb-3 text-lg font-semibold text-gray-800">
              Employes ({wIds.length})
            </h3>
            <ul className="divide-y divide-gray-100">
              {wIds.map((wId) => (
                <li key={wId} className="py-2">
                  <span className="font-medium text-gray-800 text-sm">{wId}</span>
                </li>
              ))}
            </ul>
          </Card>
        );
      })()}

      {/* Assets */}
      {log.assets && log.assets.length > 0 && (
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">
            Assets ({log.assets.length})
          </h3>
          <ul className="divide-y divide-gray-100">
            {log.assets.map((asset) => (
              <li
                key={asset.id}
                className="flex cursor-pointer items-center justify-between py-2 hover:bg-gray-50"
                onClick={() => router.push(`/assets/${asset.id}`)}
              >
                <span className="font-medium text-gray-800">{asset.name}</span>
                <Badge variant="info">
                  {asset.type in assetTypeLabels
                    ? assetTypeLabels[asset.type]
                    : asset.type}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Quantities */}
      {log.quantities && log.quantities.length > 0 && (
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">
            Quantites ({log.quantities.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 font-medium">Mesure</th>
                  <th className="pb-2 font-medium">Valeur</th>
                  <th className="pb-2 font-medium">Unite</th>
                  <th className="pb-2 font-medium">Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {log.quantities.map((q, idx) => (
                  <tr key={q.id ?? idx}>
                    <td className="py-2 capitalize">{q.measure}</td>
                    <td className="py-2">
                      {q.denominator && q.denominator !== 1
                        ? `${q.numerator}/${q.denominator}`
                        : q.numerator}
                    </td>
                    <td className="py-2">{q.unit}</td>
                    <td className="py-2 text-gray-500">{q.label ?? '—'}</td>
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
