'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import {
  observationFormTypeValues,
  formTypeLabels,
} from '@/lib/validators/observation.validator';

type ObservationRow = Record<string, unknown> & {
  id: string;
  formType: string;
  cropType: string | null;
  variety: string | null;
  observationDate: string;
  assetName: string;
  observerName: string;
  calculated: Record<string, unknown> | null;
};

const formTypeBadgeVariant: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  emergence_density: 'success',
  cultural_stage: 'info',
  pest_disease: 'warning',
  pre_harvest_grading: 'danger',
};

export function ObservationListClient() {
  const router = useRouter();
  const [formType, setFormType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.observation.list.useQuery({
    formType: (formType || undefined) as typeof observationFormTypeValues[number] | undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    limit: 25,
  });

  const columns = [
    {
      key: 'observationDate',
      header: 'Date',
      render: (row: ObservationRow) => {
        const d = new Date(row.observationDate);
        return d.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      },
    },
    {
      key: 'formType',
      header: 'Type de fiche',
      render: (row: ObservationRow) => (
        <Badge variant={formTypeBadgeVariant[row.formType] ?? 'info'}>
          {formTypeLabels[row.formType] ?? row.formType}
        </Badge>
      ),
    },
    {
      key: 'assetName',
      header: 'Parcelle',
    },
    {
      key: 'cropType',
      header: 'Culture',
      render: (row: ObservationRow) => row.cropType ?? '—',
    },
    {
      key: 'observerName',
      header: 'Observateur',
    },
    {
      key: 'result',
      header: 'Résultat clé',
      render: (row: ObservationRow) => {
        const calc = row.calculated as Record<string, number> | null;
        if (!calc) return '—';
        if (row.formType === 'emergence_density' && calc.emergence_rate_pct != null) {
          return `${calc.emergence_rate_pct}% levée`;
        }
        if (row.formType === 'pre_harvest_grading' && calc.marketable_pct != null) {
          return `${calc.marketable_pct}% valorisable`;
        }
        return '—';
      },
    },
  ];

  const formTypeOptions = [
    { value: '', label: 'Tous les types' },
    ...observationFormTypeValues.map((v) => ({
      value: v,
      label: formTypeLabels[v],
    })),
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-52">
          <Select
            label="Type de fiche"
            options={formTypeOptions}
            value={formType}
            onChange={(e) => {
              setFormType(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Input
            label="Date début"
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Input
            label="Date fin"
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={(data?.items ?? []) as ObservationRow[]}
            emptyMessage="Aucune observation"
            onRowClick={(row) => router.push(`/observations/${row.id}`)}
          />

          {data && data.pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {data.page} / {data.pages} ({data.total} résultats)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
