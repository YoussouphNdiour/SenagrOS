'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Archive, AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

interface AnimalData {
  individual_id?: string;
  breed?: string;
  current_weight_kg?: number;
  livestock_type?: string;
  health_status?: string;
  next_vaccination?: { date: string; type: string };
}

interface AnimalAsset extends Record<string, unknown> {
  id: string;
  name: string;
  type: string;
  status: string | null;
  farmId: string;
  parentId: string | null;
  notes: string | null;
  data: unknown;
  createdAt: Date | null;
  updatedAt: Date | null;
  archivedAt: Date | null;
}

const livestockTypeLabels: Record<string, string> = {
  embouche: 'Embouche',
  naisseur: 'Naisseur',
  laitier: 'Laitier',
  mixte: 'Mixte',
};

const healthVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  bon: 'success',
  surveille: 'warning',
  malade: 'danger',
  traitement: 'warning',
};

const statusOptions = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
];

function getAnimalData(asset: AnimalAsset): AnimalData {
  if (asset.data && typeof asset.data === 'object' && !Array.isArray(asset.data)) {
    return asset.data as AnimalData;
  }
  return {};
}

function getVaccinationAlert(nextVaccination?: { date: string; type: string }): 'overdue' | 'soon' | null {
  if (!nextVaccination?.date) return null;
  const nextDate = new Date(nextVaccination.date);
  const now = new Date();
  const diffDays = (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 7) return 'soon';
  return null;
}

interface AnimalListClientProps {
  farmId: string;
}

export function AnimalListClient({ farmId }: AnimalListClientProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive' | 'archived' | ''>('');

  const { data, isLoading } = trpc.asset.list.useQuery({
    farmId,
    type: 'animal',
    status: selectedStatus || undefined,
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
      header: 'Nom',
      render: (row: AnimalAsset) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      key: 'individual_id',
      header: 'ID individuel',
      render: (row: AnimalAsset) => {
        const d = getAnimalData(row);
        return (
          <span className="text-gray-600">{d.individual_id || '—'}</span>
        );
      },
    },
    {
      key: 'breed',
      header: 'Race',
      render: (row: AnimalAsset) => {
        const d = getAnimalData(row);
        return <span className="text-gray-600">{d.breed || '—'}</span>;
      },
    },
    {
      key: 'current_weight',
      header: 'Poids (kg)',
      render: (row: AnimalAsset) => {
        const d = getAnimalData(row);
        return (
          <span className="text-gray-600">
            {d.current_weight_kg ? `${d.current_weight_kg} kg` : '—'}
          </span>
        );
      },
    },
    {
      key: 'livestock_type',
      header: 'Type elevage',
      render: (row: AnimalAsset) => {
        const d = getAnimalData(row);
        return (
          <span className="text-gray-600">
            {d.livestock_type
              ? livestockTypeLabels[d.livestock_type] ?? d.livestock_type
              : '—'}
          </span>
        );
      },
    },
    {
      key: 'health_status',
      header: 'Sante',
      render: (row: AnimalAsset) => {
        const d = getAnimalData(row);
        const vacAlert = getVaccinationAlert(d.next_vaccination);
        return (
          <div className="flex items-center gap-1">
            {d.health_status ? (
              <Badge variant={healthVariant[d.health_status] ?? 'default'}>
                {d.health_status}
              </Badge>
            ) : (
              <span className="text-gray-400">—</span>
            )}
            {vacAlert === 'overdue' && (
              <span title="Vaccination en retard">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </span>
            )}
            {vacAlert === 'soon' && (
              <span title="Vaccination imminente">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (row: AnimalAsset) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Archiver cet animal ?')) {
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
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un animal..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
        </div>

        <Select
          options={[{ value: '', label: 'Tous les statuts' }, ...statusOptions]}
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value as 'active' | 'inactive' | 'archived' | '');
            setPage(1);
          }}
          className="w-40"
        />

        <Button onClick={() => router.push('/assets/new?type=animal')}>
          <Plus className="h-4 w-4" />
          Nouvel animal
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
        </div>
      ) : (
        <DataTable<AnimalAsset>
          columns={columns}
          data={(data?.items ?? []) as AnimalAsset[]}
          emptyMessage="Aucun animal trouve"
          onRowClick={(row) => router.push(`/assets/${row.id}`)}
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
