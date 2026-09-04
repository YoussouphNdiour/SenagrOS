'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import {
  planTypeLabels,
  planStatusLabels,
  seasonLabels,
} from '@/lib/validators/plan.validator';
import type { PlanType, PlanStatus } from '@/lib/validators/plan.validator';
import { Trash2 } from 'lucide-react';

const typeOptions = [
  { value: '', label: 'Tous les types' },
  ...Object.entries(planTypeLabels).map(([value, label]) => ({ value, label })),
];

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  ...Object.entries(planStatusLabels).map(([value, label]) => ({ value, label })),
];

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  active: 'info',
  completed: 'success',
  cancelled: 'danger',
};

export function PlanListClient() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.plan.list.useQuery({
    search: search || undefined,
    type: (typeFilter as PlanType) || undefined,
    status: (statusFilter as PlanStatus) || undefined,
    page,
    limit: 25,
  });

  const deleteMutation = trpc.plan.delete.useMutation({
    onSuccess: () => {
      utils.plan.list.invalidate();
      utils.plan.kpis.invalidate();
    },
  });

  const items = data?.items ?? [];
  const pages = data?.pages ?? 1;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Rechercher un plan..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Chargement...</p>
      ) : items.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-gray-500">
            <p className="text-lg font-medium">Aucun plan trouvé</p>
            <p className="mt-1 text-sm">Créez votre premier plan de campagne</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((plan) => (
            <Card key={plan.id}>
              <div className="flex items-start justify-between">
                <Link href={`/plans/${plan.id}`} className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{plan.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant={statusVariant[plan.status ?? 'active'] ?? 'default'}>
                      {planStatusLabels[(plan.status ?? 'active') as PlanStatus] ?? plan.status}
                    </Badge>
                    <Badge variant="info">
                      {planTypeLabels[plan.type as PlanType] ?? plan.type}
                    </Badge>
                    {plan.season && (
                      <Badge variant="default">
                        {seasonLabels[plan.season] ?? plan.season}
                      </Badge>
                    )}
                  </div>
                  {(plan.startDate || plan.endDate) && (
                    <p className="mt-2 text-sm text-gray-500">
                      {plan.startDate && `Du ${plan.startDate}`}
                      {plan.startDate && plan.endDate && ' '}
                      {plan.endDate && `au ${plan.endDate}`}
                    </p>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Supprimer ce plan ?')) {
                      deleteMutation.mutate({ id: plan.id });
                    }
                  }}
                  className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Précédent
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} / {pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
