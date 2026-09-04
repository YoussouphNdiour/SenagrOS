'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import type { logTypeValues, logStatusValues } from '@/lib/validators/log.validator';

type LogType = (typeof logTypeValues)[number];
type LogStatus = (typeof logStatusValues)[number];

interface Log extends Record<string, unknown> {
  id: string;
  name: string;
  type: LogType;
  status: LogStatus;
  timestamp: Date | string | null;
  farmId: string;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

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

const typeOptions = (Object.entries(typeLabels) as [LogType, string][]).map(
  ([value, label]) => ({ value, label }),
);

const statusLabels: Record<LogStatus, string> = {
  pending: 'En attente',
  done: 'Termine',
  cancelled: 'Annule',
};

const statusOptions = (Object.entries(statusLabels) as [LogStatus, string][]).map(
  ([value, label]) => ({ value, label }),
);

const statusVariant: Record<LogStatus, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  done: 'success',
  cancelled: 'danger',
};

function getStatusVariant(status: string | null): 'warning' | 'success' | 'danger' | 'default' {
  if (status === 'pending' || status === 'done' || status === 'cancelled') {
    return statusVariant[status];
  }
  return 'default';
}

interface LogListClientProps {
  filterType?: LogType;
}

export function LogListClient({ filterType }: LogListClientProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<LogType | ''>(filterType ?? '');
  const [selectedStatus, setSelectedStatus] = useState<LogStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading } = trpc.log.list.useQuery({
    type: selectedType !== '' ? selectedType : undefined,
    status: selectedStatus !== '' ? selectedStatus : undefined,
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    limit: 25,
  });

  const utils = trpc.useUtils();
  const deleteMutation = trpc.log.delete.useMutation({
    onSuccess: () => utils.log.list.invalidate(),
  });

  const columns = [
    {
      key: 'name',
      header: 'Nom',
      render: (row: Log) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row: Log) => (
        <Badge variant="info">{typeLabels[row.type] ?? row.type}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (row: Log) => (
        <Badge variant={getStatusVariant(row.status)}>
          {statusLabels[row.status] ?? row.status ?? '—'}
        </Badge>
      ),
    },
    {
      key: 'timestamp',
      header: 'Date',
      render: (row: Log) =>
        row.timestamp
          ? new Date(row.timestamp).toLocaleDateString('fr-FR')
          : '—',
    },
    {
      key: 'actions',
      header: '',
      render: (row: Log) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Supprimer ce log ?')) {
              deleteMutation.mutate({ id: row.id });
            }
          }}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
      className: 'w-12',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un log..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
        </div>

        {!filterType && (
          <Select
            options={[{ value: '', label: 'Tous les types' }, ...typeOptions]}
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value as LogType | '');
              setPage(1);
            }}
            className="w-44"
          />
        )}

        <Select
          options={[{ value: '', label: 'Tous les statuts' }, ...statusOptions]}
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value as LogStatus | '');
            setPage(1);
          }}
          className="w-40"
        />

        <div className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Du</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Au</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
        </div>

        <Button onClick={() => router.push('/logs/new')}>
          <Plus className="h-4 w-4" />
          Nouveau
        </Button>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
        </div>
      ) : (
        <DataTable<Log>
          columns={columns}
          data={(data?.items ?? []) as Log[]}
          emptyMessage="Aucun log trouve"
          onRowClick={(row) => router.push(`/logs/${row.id}`)}
        />
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {data.total} resultat{data.total > 1 ? 's' : ''} — Page {data.page}/{data.pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Precedent
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
    </div>
  );
}
