'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ComboboxAsync } from '@/components/ui/ComboboxAsync';
import {
  planTypeLabels,
  planStatusLabels,
  seasonLabels,
} from '@/lib/validators/plan.validator';
import type { PlanType, PlanStatus } from '@/lib/validators/plan.validator';
import { ArrowLeft, Edit, Trash2, Plus, X, CheckCircle, Clock } from 'lucide-react';

interface PlanDetailClientProps {
  id: string;
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  active: 'info',
  completed: 'success',
  cancelled: 'danger',
};

const logStatusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  done: 'success',
  pending: 'warning',
  cancelled: 'danger',
};

export function PlanDetailClient({ id }: PlanDetailClientProps) {
  const router = useRouter();
  const [showAddLog, setShowAddLog] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState('');

  const utils = trpc.useUtils();

  const { data: plan, isLoading } = trpc.plan.getById.useQuery({ id });

  const deleteMutation = trpc.plan.delete.useMutation({
    onSuccess: () => {
      router.push('/plans');
    },
  });

  const addLogMutation = trpc.plan.addLog.useMutation({
    onSuccess: () => {
      utils.plan.getById.invalidate({ id });
      setShowAddLog(false);
      setSelectedLogId('');
    },
  });

  const removeLogMutation = trpc.plan.removeLog.useMutation({
    onSuccess: () => {
      utils.plan.getById.invalidate({ id });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="py-12 text-center text-gray-500">Plan introuvable</div>
    );
  }

  const logs = plan.logs ?? [];
  const doneLogs = logs.filter((l) => l.status === 'done').length;
  const totalLogs = logs.length;
  const progressPct = totalLogs > 0 ? Math.round((doneLogs / totalLogs) * 100) : 0;

  const searchLogs = async (query: string) => {
    const result = await utils.log.list.fetch({
      search: query || undefined,
      page: 1,
      limit: 20,
    });
    // Filter out logs already in the plan
    const existingIds = new Set(logs.map((l) => l.id));
    return result.items.filter((l) => !existingIds.has(l.id));
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/plans')}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">{plan.name}</h1>
              <Badge variant={statusVariant[plan.status ?? 'active'] ?? 'default'}>
                {planStatusLabels[(plan.status ?? 'active') as PlanStatus] ?? plan.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              {planTypeLabels[plan.type as PlanType] ?? plan.type}
              {plan.season && ` — ${seasonLabels[plan.season] ?? plan.season}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/plans/${id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <Edit className="h-4 w-4" />
            Éditer
          </Link>
          <button
            type="button"
            onClick={() => {
              if (confirm('Supprimer ce plan ?')) {
                deleteMutation.mutate({ id });
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Informations
          </h3>
          <dl className="space-y-2">
            <InfoRow label="Type" value={planTypeLabels[plan.type as PlanType] ?? plan.type} />
            <InfoRow label="Statut" value={planStatusLabels[(plan.status ?? 'active') as PlanStatus] ?? plan.status} />
            {plan.season && (
              <InfoRow label="Saison" value={seasonLabels[plan.season] ?? plan.season} />
            )}
            {plan.startDate && <InfoRow label="Date début" value={plan.startDate} />}
            {plan.endDate && <InfoRow label="Date fin" value={plan.endDate} />}
            {plan.notes && <InfoRow label="Notes" value={plan.notes} />}
          </dl>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Progression
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-600">Logs complétés</span>
                <span className="font-medium text-gray-800">
                  {doneLogs} / {totalLogs}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-3 rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-green-600">{progressPct}%</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Terminés</p>
                <p className="text-lg font-semibold text-gray-800">{doneLogs}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">En attente</p>
                <p className="text-lg font-semibold text-gray-800">{totalLogs - doneLogs}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Logs associés */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Logs associés ({totalLogs})
          </h3>
          <Button
            variant="outline"
            onClick={() => setShowAddLog(!showAddLog)}
          >
            {showAddLog ? (
              <>
                <X className="mr-1.5 h-4 w-4" /> Fermer
              </>
            ) : (
              <>
                <Plus className="mr-1.5 h-4 w-4" /> Ajouter un log
              </>
            )}
          </Button>
        </div>

        {showAddLog && (
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Rechercher et associer un log existant
            </p>
            <div className="flex gap-3">
              <div className="flex-1">
                <ComboboxAsync
                  placeholder="Rechercher un log par nom..."
                  value={selectedLogId}
                  onChange={setSelectedLogId}
                  searchFn={searchLogs}
                  getLabel={(item) => `${item.name} (${item.type})`}
                  getValue={(item) => item.id}
                />
              </div>
              <Button
                onClick={() => {
                  if (selectedLogId) {
                    addLogMutation.mutate({ planId: id, logId: selectedLogId });
                  }
                }}
                disabled={!selectedLogId || addLogMutation.isPending}
              >
                {addLogMutation.isPending ? 'Ajout...' : 'Associer'}
              </Button>
            </div>
            {addLogMutation.isError && (
              <p className="mt-2 text-sm text-red-500">{addLogMutation.error.message}</p>
            )}
          </div>
        )}

        {logs.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>Aucun log associé à ce plan</p>
            <p className="mt-1 text-sm">Utilisez le bouton ci-dessus pour associer des logs</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Link
                    href={`/logs/${log.id}`}
                    className="font-medium text-gray-800 hover:text-green-600"
                  >
                    {log.name}
                  </Link>
                  <Badge variant={logStatusVariant[log.status ?? 'pending'] ?? 'default'}>
                    {log.status === 'done' ? 'Terminé' : log.status === 'cancelled' ? 'Annulé' : 'En attente'}
                  </Badge>
                  <Badge variant="info">{log.type}</Badge>
                  {log.timestamp && (
                    <span className="text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Retirer ce log du plan ?')) {
                      removeLogMutation.mutate({ planId: id, logId: log.id });
                    }
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-800">{value}</dd>
    </div>
  );
}
