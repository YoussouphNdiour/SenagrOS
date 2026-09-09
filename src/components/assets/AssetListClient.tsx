'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Archive } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import type { assetTypeValues } from '@/lib/validators/asset.validator';

type AssetType = (typeof assetTypeValues)[number];
type AssetStatus = 'active' | 'inactive' | 'archived';

interface Asset extends Record<string, unknown> {
  id: string;
  name: string;
  type: AssetType;
  status: string | null;
  farmId: string;
  parentId: string | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  archivedAt: Date | null;
}

const typeKeys: Record<AssetType, string> = {
  land: 'typeLand',
  plant: 'typePlant',
  animal: 'typeAnimal',
  equipment: 'typeEquipment',
  structure: 'typeStructure',
  material: 'typeMaterial',
  sensor: 'typeSensor',
  water: 'typeWater',
  seed: 'typeSeed',
  product: 'typeProduct',
  compost: 'typeCompost',
  group: 'typeGroup',
};

const statusVariant: Record<AssetStatus, 'success' | 'warning' | 'danger'> = {
  active: 'success',
  inactive: 'warning',
  archived: 'danger',
};

function getStatusVariant(status: string | null): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'active' || status === 'inactive' || status === 'archived') {
    return statusVariant[status];
  }
  return 'default';
}

interface AssetListClientProps {
  farmId: string;
  filterType?: AssetType;
}

export function AssetListClient({ farmId, filterType }: AssetListClientProps) {
  const router = useRouter();
  const t = useTranslations('assets');
  const tc = useTranslations('common');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<AssetType | ''>(filterType ?? '');
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus | ''>('');

  const typeOptions = (Object.entries(typeKeys) as [AssetType, string][]).map(
    ([value, key]) => ({ value, label: t(key) }),
  );

  const statusOptions = [
    { value: 'active', label: t('statusActive') },
    { value: 'inactive', label: t('statusInactive') },
  ];

  const { data, isLoading } = trpc.asset.list.useQuery({
    farmId,
    type: selectedType !== '' ? selectedType : undefined,
    status: selectedStatus !== '' ? selectedStatus : undefined,
    search: search || undefined,
    page,
    limit: 25,
  });

  const utils = trpc.useUtils();
  const archiveMutation = trpc.asset.archive.useMutation({
    onSuccess: () => utils.asset.list.invalidate(),
  });

  const columns = [
    {
      key: 'name',
      header: tc('name'),
      render: (row: Asset) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      key: 'type',
      header: tc('type'),
      render: (row: Asset) => (
        <Badge variant="info">{typeKeys[row.type] ? t(typeKeys[row.type]) : row.type}</Badge>
      ),
    },
    {
      key: 'status',
      header: tc('status'),
      render: (row: Asset) => (
        <Badge variant={getStatusVariant(row.status)}>
          {row.status ?? '—'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: t('detailCreatedAt'),
      render: (row: Asset) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleDateString('fr-FR')
          : '—',
    },
    {
      key: 'actions',
      header: '',
      render: (row: Asset) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(t('archiveConfirm'))) {
              archiveMutation.mutate({ id: row.id });
            }
          }}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
          title={tc('archive')}
        >
          <Archive className="h-4 w-4" />
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
              setSelectedType(e.target.value as AssetType | '');
              setPage(1);
            }}
            className="w-44"
          />
        )}

        <Select
          options={[{ value: '', label: tc('allStatuses') }, ...statusOptions]}
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value as AssetStatus | '');
            setPage(1);
          }}
          className="w-40"
        />

        <Button onClick={() => router.push('/assets/new')}>
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
        <DataTable<Asset>
          columns={columns}
          data={(data?.items ?? []) as Asset[]}
          emptyMessage={tc('noResult')}
          onRowClick={(row) => router.push(`/assets/${row.id}`)}
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
