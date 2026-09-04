'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { formatFCFA } from '@/lib/validators/finance.validator';

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const periodOptions = [{ value: 'month', label: 'Ce mois-ci' }];

export function VenteListClient() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.finance.listSales.useQuery({
    search: search || undefined,
    page,
    limit: 25,
  });

  const deleteMutation = trpc.finance.deleteTransaction.useMutation({
    onSuccess: () => {
      utils.finance.listSales.invalidate();
      utils.finance.salesKpis.invalidate();
    },
  });

  return (
    <Card padding={false}>
      <div className="p-5">
        <CardHeader title="Historique des ventes" />

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="w-64">
            <Input
              placeholder="Rechercher produit, client..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-44">
            <Select
              options={periodOptions}
              value="month"
              onChange={() => {}}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
        </div>
      ) : data?.items.length === 0 ? (
        <div className="px-5 pb-8 pt-2 text-center text-sm text-gray-500">
          Aucune vente enregistrée. Cliquez sur «&nbsp;Nouvelle vente&nbsp;» pour commencer.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Produit</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3 text-right">Quantité</th>
                  <th className="px-5 py-3 text-right">Prix Unit.</th>
                  <th className="px-5 py-3 text-right">Montant</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {row.productName ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {row.clientName ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600">
                      {row.quantity != null
                        ? `${row.quantity}${row.unit ? ` ${row.unit}` : ''}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600">
                      {row.unitPrice != null ? formatFCFA(Number(row.unitPrice)) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-green-700">
                      {formatFCFA(Number(row.amount))}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate({ id: row.id })}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
              <p className="text-xs text-gray-500">
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
    </Card>
  );
}
