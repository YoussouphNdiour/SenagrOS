'use client';

import { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import {
  formatFCFA,
  transactionTypeLabels,
  transactionCategoryLabels,
} from '@/lib/validators/finance.validator';
import type { TransactionType, TransactionCategory } from '@/lib/validators/finance.validator';

const typeOptions = [
  { value: '', label: 'Tous les types' },
  ...( Object.entries(transactionTypeLabels) as [TransactionType, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
];

const categoryOptions = [
  { value: '', label: 'Toutes les catégories' },
  ...(Object.entries(transactionCategoryLabels) as [TransactionCategory, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
];

function getTypeBadgeVariant(type: TransactionType): 'success' | 'danger' | 'info' | 'warning' {
  switch (type) {
    case 'sale':
    case 'income':
      return 'success';
    case 'purchase':
      return 'warning';
    case 'expense':
      return 'danger';
    default:
      return 'info';
  }
}

function isPositiveAmount(type: TransactionType): boolean {
  return type === 'sale' || type === 'income';
}

function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory | null;
  description: string;
  amount: string | number;
  date: Date | string | null;
}

export function FinanceListClient() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  const currentMonth = new Date().toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  const { data, isLoading } = trpc.finance.listTransactions.useQuery({
    type: typeFilter !== '' ? (typeFilter as TransactionType) : undefined,
    category: categoryFilter !== '' ? (categoryFilter as TransactionCategory) : undefined,
    search: search || undefined,
    page,
    limit: 25,
  });

  const utils = trpc.useUtils();
  const deleteMutation = trpc.finance.deleteTransaction.useMutation({
    onSuccess: () => {
      utils.finance.listTransactions.invalidate();
      utils.finance.financeKpis.invalidate();
    },
  });

  const items = (data?.items ?? []) as Transaction[];

  return (
    <Card>
      <CardHeader title={`Journal des transactions — ${currentMonth}`} />

      {/* Filters row */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une transaction..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
        </div>

        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="w-44"
        />

        <Select
          options={categoryOptions}
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="w-52"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">
          Aucune transaction ne correspond aux filtres.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Description</th>
                <th className="pb-3 pr-4">Catégorie</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4 text-right">Montant</th>
                <th className="pb-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                    {formatDate(tx.date)}
                  </td>
                  <td className="py-3 pr-4 font-medium text-gray-900 max-w-xs truncate">
                    {tx.description}
                  </td>
                  <td className="py-3 pr-4 text-gray-600">
                    {tx.category ? transactionCategoryLabels[tx.category] : '—'}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={getTypeBadgeVariant(tx.type)}>
                      {transactionTypeLabels[tx.type]}
                    </Badge>
                  </td>
                  <td className={`py-3 pr-4 text-right font-semibold tabular-nums ${
                    isPositiveAmount(tx.type) ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isPositiveAmount(tx.type) ? '+' : '-'}{formatFCFA(Number(tx.amount))}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Supprimer cette transaction ?')) {
                          deleteMutation.mutate({ id: tx.id });
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
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
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {data.total} transaction{data.total > 1 ? 's' : ''} — Page {data.page}/{data.pages}
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
    </Card>
  );
}
