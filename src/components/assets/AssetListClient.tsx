'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Archive, Sprout } from 'lucide-react';
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

const typeLabels: Record<AssetType, string> = {
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

const typeOptions = (Object.entries(typeLabels) as [AssetType, string][]).map(
  ([value, label]) => ({ value, label }),
);

const statusOptions = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
];

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
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<AssetType | ''>(filterType ?? '');
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus | ''>('');

  const { data, isLoading } = trpc.asset.list.useQuery({
    farmId,
    type: selectedType !== '' ? selectedType : undefined,
    status: selectedStatus !== '' ? selectedStatus : undefined,
    search: search || undefined,
    page,
    limit: 25,
  });

  const { data: cropCounts } = trpc.asset.cropCountByParcel.useQuery(undefined, {
    enabled: !selectedType || selectedType === 'land',
  });

  const utils = trpc.useUtils();
  const archiveMutation = trpc.asset.archive.useMutation({
    onSuccess: () => utils.asset.list.invalidate(),
  });

  const columns = [
    {
      key: 'name',
      header: 'Nom',
      render: (row: Asset) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row: Asset) => (
        <Badge variant="info">{typeLabels[row.type] ?? row.type}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (row: Asset) => (
        <Badge variant={getStatusVariant(row.status)}>
          {row.status ?? '—'}
        </Badge>
      ),
    },
    {
      key: 'crops',
      header: 'Cultures',
      render: (row: Asset) => {
        if (row.type !== 'land') return null;
        const cropCount = cropCounts?.[row.id] ?? 0;
        return (
          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
            <Sprout className="h-3.5 w-3.5 text-green-600" />
            {cropCount}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Cree le',
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
            if (confirm('Archiver cet asset ?')) {
              archiveMutation.mutate({ id: row.id });
            }
          }}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
          title="Archiver"
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
            placeholder="Rechercher un asset..."
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
              setSelectedType(e.target.value as AssetType | '');
              setPage(1);
            }}
            className="w-44"
          />
        )}

        <Select
          options={[{ value: '', label: 'Tous les statuts' }, ...statusOptions]}
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value as AssetStatus | '');
            setPage(1);
          }}
          className="w-40"
        />

        <Button onClick={() => router.push('/assets/new')}>
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
        <DataTable<Asset>
          columns={columns}
          data={(data?.items ?? []) as Asset[]}
          emptyMessage="Aucun asset trouve"
          onRowClick={(row) =>
            router.push(row.type === 'land' ? `/assets/land/${row.id}` : `/assets/${row.id}`)
          }
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
