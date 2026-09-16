'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

function formatFCFA(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

const unitLabels: Record<string, string> = {
  kg: 'kg',
  L: 'L',
  g: 'g',
  mL: 'mL',
  sac: 'Sac',
  unite: 'Unite',
};

interface StockDetailClientProps {
  assetId: string;
}

export function StockDetailClient({ assetId }: StockDetailClientProps) {
  const router = useRouter();
  const { data, isLoading } = trpc.inventory.getByAsset.useQuery({ assetId });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Article introuvable
      </div>
    );
  }

  const { asset, currentStock, stockUnit, unitPriceXof, stockThreshold, valorisation, movements } =
    data;
  const unitLabel = unitLabels[stockUnit] ?? stockUnit;
  const isLow = stockThreshold > 0 && currentStock < stockThreshold;

  return (
    <div className="space-y-6">
      {/* Header */}
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
            {isLow && <Badge variant="danger">Stock bas</Badge>}
          </div>
          {asset.notes && (
            <p className="mt-1 text-sm text-gray-500">{asset.notes}</p>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Stock actuel</p>
              <p className={`text-xl font-bold ${isLow ? 'text-red-600' : 'text-gray-800'}`}>
                {currentStock} {unitLabel}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Seuil d&apos;alerte</p>
              <p className="text-xl font-bold text-gray-800">
                {stockThreshold > 0 ? `${stockThreshold} ${unitLabel}` : '---'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Prix unitaire</p>
              <p className="text-xl font-bold text-gray-800">
                {unitPriceXof > 0 ? `${formatFCFA(unitPriceXof)} FCFA` : '---'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Valorisation</p>
              <p className="text-xl font-bold text-gray-800">
                {valorisation > 0 ? `${formatFCFA(valorisation)} FCFA` : '---'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Movement history */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          Historique des mouvements ({movements.length})
        </h3>

        {movements.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            Aucun mouvement enregistre
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Quantite</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Unite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((movement) => {
                  const qty = Number(movement.quantity);
                  let movementType: string;
                  let badgeVariant: 'success' | 'danger' | 'warning';

                  if (qty > 0) {
                    movementType = 'Entree';
                    badgeVariant = 'success';
                  } else if (qty < 0) {
                    movementType = 'Sortie';
                    badgeVariant = 'danger';
                  } else {
                    movementType = 'Ajustement';
                    badgeVariant = 'warning';
                  }

                  return (
                    <tr key={movement.id}>
                      <td className="px-4 py-3 text-gray-700">
                        {movement.createdAt
                          ? new Date(movement.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '---'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={badgeVariant}>{movementType}</Badge>
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${qty < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {qty > 0 ? `+${qty}` : qty}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {unitLabels[movement.unit] ?? movement.unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
