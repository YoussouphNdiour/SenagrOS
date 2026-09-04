'use client';

import { useState } from 'react';
import { Trash2, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  formatFCFA,
  invoiceTypeLabels,
  invoiceStatusLabels,
  type InvoiceType,
  type InvoiceStatus,
} from '@/lib/validators/finance.validator';

type BadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'danger';

const statusBadgeVariant: Record<InvoiceStatus, BadgeVariant> = {
  draft: 'default',
  sent: 'info',
  paid: 'success',
  overdue: 'warning',
  cancelled: 'danger',
};

type TabKey = '' | InvoiceType;

const tabs: { key: TabKey; label: string }[] = [
  { key: '', label: 'Tous' },
  { key: 'devis', label: invoiceTypeLabels.devis },
  { key: 'proforma', label: invoiceTypeLabels.proforma },
  { key: 'facture', label: invoiceTypeLabels.facture },
];

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;
  clientName: string;
  issueDate: Date | string;
  totalAmount: string | number;
}

export function InvoiceListClient() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TabKey>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.finance.listInvoices.useQuery({
    type: typeFilter !== '' ? typeFilter : undefined,
    search: search || undefined,
    page,
    limit: 25,
  });

  const deleteMutation = trpc.finance.deleteInvoice.useMutation({
    onSuccess: () => {
      utils.finance.listInvoices.invalidate();
      utils.finance.invoiceKpis.invalidate();
    },
  });

  const updateMutation = trpc.finance.updateInvoice.useMutation({
    onSuccess: () => {
      utils.finance.listInvoices.invalidate();
      utils.finance.invoiceKpis.invalidate();
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce document ?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleTogglePaid = (row: InvoiceRow) => {
    const nextStatus: InvoiceStatus = row.status === 'paid' ? 'sent' : 'paid';
    updateMutation.mutate({ id: row.id, status: nextStatus });
  };

  return (
    <div className="rounded-xl bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-100 px-5 pt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Documents</h2>
          <div className="w-64">
            <Input
              placeholder="N° ou client..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setTypeFilter(tab.key);
                setPage(1);
              }}
              className={`px-4 pb-3 text-sm font-medium transition-colors ${
                typeFilter === tab.key
                  ? 'border-b-2 border-green-500 text-green-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            Aucun document. Créez votre premier devis ou facture.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                    <th className="pb-3 pr-4">N°</th>
                    <th className="pb-3 pr-4">Client</th>
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4 text-right">Montant (FCFA)</th>
                    <th className="pb-3 pr-4">Statut</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(data.items as unknown as InvoiceRow[]).map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4 font-mono text-xs text-gray-600">
                        {row.invoiceNumber}
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-800">{row.clientName}</td>
                      <td className="py-3 pr-4 text-gray-500">
                        {new Date(row.issueDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold text-gray-800">
                        {formatFCFA(Number(row.totalAmount))}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusBadgeVariant[row.status]}>
                          {invoiceStatusLabels[row.status]}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          {row.type === 'facture' && (
                            <button
                              type="button"
                              title={row.status === 'paid' ? 'Marquer comme envoyée' : 'Marquer comme payée'}
                              onClick={() => handleTogglePaid(row)}
                              disabled={updateMutation.isPending}
                              className="rounded p-1 text-gray-400 transition hover:text-green-600 disabled:opacity-40"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Supprimer"
                            onClick={() => handleDelete(row.id)}
                            disabled={deleteMutation.isPending}
                            className="rounded p-1 text-gray-400 transition hover:text-red-600 disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.pages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
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
      </div>
    </div>
  );
}
