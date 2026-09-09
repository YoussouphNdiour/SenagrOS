'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
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

const typeKeys: Record<LogType, string> = {
  activity: 'typeActivity',
  observation: 'typeObservation',
  input: 'typeInput',
  harvest: 'typeHarvest',
  seeding: 'typeSeeding',
  transplanting: 'typeTransplanting',
  birth: 'typeBirth',
  maintenance: 'typeMaintenance',
  medical: 'typeMedical',
  lab_test: 'typeLabTest',
  movement: 'typeMovement',
  irrigation: 'typeIrrigation',
};

const statusKeys: Record<LogStatus, string> = {
  pending: 'statusPending',
  done: 'statusDone',
  cancelled: 'statusCancelled',
};

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
  const t = useTranslations('logs');
  const tc = useTranslations('common');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<LogType | ''>(filterType ?? '');
  const [selectedStatus, setSelectedStatus] = useState<LogStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const typeOptions = (Object.entries(typeKeys) as [LogType, string][]).map(
    ([value, key]) => ({ value, label: t(key) }),
  );

  const statusOptions = (Object.entries(statusKeys) as [LogStatus, string][]).map(
    ([value, key]) => ({ value, label: t(key) }),
  );

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
      header: tc('name'),
      render: (row: Log) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      key: 'type',
      header: tc('type'),
      render: (row: Log) => (
        <Badge variant="info">{typeKeys[row.type] ? t(typeKeys[row.type]) : row.type}</Badge>
      ),
    },
    {
      key: 'status',
      header: tc('status'),
      render: (row: Log) => (
        <Badge variant={getStatusVariant(row.status)}>
          {statusKeys[row.status] ? t(statusKeys[row.status]) : (row.status ?? '—')}
        </Badge>
      ),
    },
    {
      key: 'timestamp',
      header: tc('date'),
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
            if (confirm(t('deleteConfirm'))) {
              deleteMutation.mutate({ id: row.id });
            }
          }}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
          title={tc('delete')}
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
            placeholder={t('searchPlaceholder')}
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
            options={[{ value: '', label: tc('allTypes') }, ...typeOptions]}
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value as LogType | '');
              setPage(1);
            }}
            className="w-44"
          />
        )}

        <Select
          options={[{ value: '', label: tc('allStatuses') }, ...statusOptions]}
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value as LogStatus | '');
            setPage(1);
          }}
          className="w-40"
        />

        <div className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">{tc('from')}</label>
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
            <label className="mb-1 block text-xs text-gray-500">{tc('to')}</label>
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
          {tc('new')}
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
          emptyMessage={t('emptyMessage')}
          onRowClick={(row) => router.push(`/logs/${row.id}`)}
        />
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {data.total} {tc('results')} — {tc('page')} {data.page}/{data.pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {tc('previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              {tc('next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
