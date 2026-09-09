'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
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

export function VenteListClient() {
  const t = useTranslations('finances');
  const tc = useTranslations('common');
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
        <CardHeader title={t('ventesTitle')} />

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="w-64">
            <Input
              placeholder={t('financeSearchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
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
          {tc('noData')}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3">{t('venteColDate')}</th>
                  <th className="px-5 py-3">{t('venteColProduct')}</th>
                  <th className="px-5 py-3">{t('venteColClient')}</th>
                  <th className="px-5 py-3 text-right">{t('venteColQuantity')}</th>
                  <th className="px-5 py-3 text-right">{t('venteColUnitPrice')}</th>
                  <th className="px-5 py-3 text-right">{t('venteColAmount')}</th>
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
                        title={tc('delete')}
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
                {tc('page')} {data.page} / {data.pages} ({data.total} {tc('results')})
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
        </>
      )}
    </Card>
  );
}
