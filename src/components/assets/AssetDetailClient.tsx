'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Archive, Pencil } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { assetTypeValues } from '@/lib/validators/asset.validator';

type AssetType = (typeof assetTypeValues)[number];

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

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  inactive: 'warning',
  archived: 'danger',
};

function getStatusVariant(status: string | null): 'success' | 'warning' | 'danger' | 'default' {
  if (status && status in statusVariant) {
    return statusVariant[status];
  }
  return 'default';
}

interface AssetDetailClientProps {
  assetId: string;
}

export function AssetDetailClient({ assetId }: AssetDetailClientProps) {
  const router = useRouter();
  const { data: asset, isLoading } = trpc.asset.getById.useQuery({ id: assetId });

  const archiveMutation = trpc.asset.archive.useMutation({
    onSuccess: () => router.push('/assets'),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Asset introuvable
      </div>
    );
  }

  const dataEntries =
    asset.data !== null &&
    asset.data !== undefined &&
    typeof asset.data === 'object' &&
    !Array.isArray(asset.data)
      ? Object.entries(asset.data as Record<string, unknown>).filter(
          ([, v]) => v !== null && v !== undefined && v !== '',
        )
      : [];

  const typeLabelDisplay =
    asset.type in typeLabels
      ? typeLabels[asset.type as AssetType]
      : asset.type;

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
              <h1 className="text-2xl font-bold text-gray-800">{asset.name}</h1>
              <Badge variant={getStatusVariant(asset.status)}>
                {asset.status ?? '—'}
              </Badge>
              <Badge variant="info">{typeLabelDisplay}</Badge>
            </div>
            {asset.notes && (
              <p className="mt-1 text-sm text-gray-500">{asset.notes}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/assets/${asset.id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
            Modifier
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm('Archiver cet asset ?')) {
                archiveMutation.mutate({ id: asset.id });
              }
            }}
            disabled={archiveMutation.isPending}
          >
            <Archive className="h-4 w-4" />
            Archiver
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
              <dd className="font-medium">{asset.status ?? '—'}</dd>
            </div>
            {asset.isLocation && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Emplacement</dt>
                <dd className="font-medium">Oui</dd>
              </div>
            )}
            {asset.isFixed && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Fixe</dt>
                <dd className="font-medium">Oui</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Cree le</dt>
              <dd className="font-medium">
                {asset.createdAt
                  ? new Date(asset.createdAt).toLocaleDateString('fr-FR')
                  : '—'}
              </dd>
            </div>
          </dl>
        </Card>

        {/* JSONB data fields */}
        {dataEntries.length > 0 && (
          <Card>
            <h3 className="mb-3 text-lg font-semibold text-gray-800">Donnees specifiques</h3>
            <dl className="space-y-2 text-sm">
              {dataEntries.map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-gray-500">{key.replace(/_/g, ' ')}</dt>
                  <dd className="font-medium">
                    {typeof value === 'object'
                      ? JSON.stringify(value)
                      : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        )}
      </div>

      {/* Children */}
      {asset.children && asset.children.length > 0 && (
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">
            Sous-assets ({asset.children.length})
          </h3>
          <ul className="divide-y divide-gray-100">
            {asset.children.map((child) => (
              <li
                key={child.id}
                className="flex cursor-pointer items-center justify-between py-2 hover:bg-gray-50"
                onClick={() => router.push(`/assets/${child.id}`)}
              >
                <span className="font-medium text-gray-800">{child.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="info">
                    {child.type in typeLabels
                      ? typeLabels[child.type as AssetType]
                      : child.type}
                  </Badge>
                  <Badge variant={getStatusVariant(child.status)}>
                    {child.status ?? '—'}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
