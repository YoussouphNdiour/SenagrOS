'use client';

import { useState } from 'react';
import { Search, TrendingDown, TrendingUp, Scale } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { KpiCard } from '@/components/ui/KpiCard';
import { DataTable } from '@/components/ui/DataTable';
import { formatFCFA } from '@/lib/validators/finance.validator';

interface JournalEntry extends Record<string, unknown> {
  id: string;
  date: Date | null;
  label: string;
  reference: string | null;
  debit: string;
  credit: string;
  category: string | null;
  account: string | null;
}

const currentYear = new Date().getFullYear();

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function ComptabiliteClient() {
  const t = useTranslations('finances');
  const tc = useTranslations('common');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);

  const yearOptions = [{ value: String(currentYear), label: String(currentYear) }];

  const typeOptions = [
    { value: '', label: tc('allTypes') },
    { value: 'charges', label: t('accountCharges') },
    { value: 'produits', label: t('accountProduits') },
    { value: 'ventes', label: t('accountVentes') },
    { value: 'achats', label: t('accountAchats') },
    { value: 'caisse', label: t('accountCaisse') },
    { value: 'banque', label: t('accountBanque') },
  ];

  const categoryOptions = [
    { value: '', label: tc('allTypes') },
    { value: 'vente_produit', label: t('transCatVenteProduit') },
    { value: 'vente_betail', label: t('transCatVenteBetail') },
    { value: 'prestation', label: t('transCatPrestation') },
    { value: 'achat_intrant', label: t('transCatAchatIntrant') },
    { value: 'achat_equipement', label: t('transCatAchatEquipement') },
    { value: 'achat_semence', label: t('transCatAchatSemence') },
    { value: 'main_oeuvre', label: t('transCatMainOeuvre') },
    { value: 'transport', label: t('transCatTransport') },
    { value: 'entretien', label: t('transCatEntretien') },
    { value: 'energie', label: t('transCatEnergie') },
    { value: 'loyer', label: t('transCatLoyer') },
    { value: 'subvention', label: t('transCatSubvention') },
    { value: 'autre', label: t('transCatAutre') },
  ];

  const { data, isLoading } = trpc.finance.listJournal.useQuery({
    search: search || undefined,
    account: selectedType || undefined,
    category: selectedCategory || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 25,
  });

  const columns = [
    {
      key: 'date',
      header: tc('date'),
      render: (row: JournalEntry) => (
        <span className="whitespace-nowrap text-gray-600">{formatDate(row.date)}</span>
      ),
    },
    {
      key: 'label',
      header: 'Libellé',
      render: (row: JournalEntry) => (
        <span className="font-medium text-gray-900">{row.label}</span>
      ),
    },
    {
      key: 'reference',
      header: 'Référence',
      render: (row: JournalEntry) => (
        <span className="font-mono text-xs text-gray-500">{row.reference ?? '—'}</span>
      ),
    },
    {
      key: 'debit',
      header: t('comptaTotalDebit'),
      render: (row: JournalEntry) => {
        const amount = Number(row.debit);
        return amount > 0 ? (
          <span className="font-semibold text-red-600">{formatFCFA(amount)}</span>
        ) : (
          <span className="text-gray-300">—</span>
        );
      },
      className: 'text-right',
    },
    {
      key: 'credit',
      header: t('comptaTotalCredit'),
      render: (row: JournalEntry) => {
        const amount = Number(row.credit);
        return amount > 0 ? (
          <span className="font-semibold text-green-600">{formatFCFA(amount)}</span>
        ) : (
          <span className="text-gray-300">—</span>
        );
      },
      className: 'text-right',
    },
  ];

  const totalDebit = data?.totalDebit ?? 0;
  const totalCredit = data?.totalCredit ?? 0;
  const solde = data?.solde ?? 0;

  return (
    <div className="space-y-6">
      {/* Header + filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-gray-600">
            {t('comptaYear')} —{' '}
            <span className="font-bold text-gray-800">{currentYear}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {/* Year select */}
          <Select
            options={yearOptions}
            value={String(currentYear)}
            onChange={() => {}}
            className="w-28"
            aria-label={t('comptaYear')}
          />

          {/* Account / type select */}
          <Select
            options={typeOptions}
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="w-44"
            aria-label={t('comptaType')}
          />

          {/* Category select */}
          <Select
            options={categoryOptions}
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-52"
            aria-label={t('comptaCategory')}
          />

          {/* Date range */}
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-40"
            aria-label={t('comptaDateFrom')}
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-40"
            aria-label={t('comptaDateTo')}
          />

          {/* Search */}
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('comptaSearch')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
        </div>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title={t('comptaTotalDebit')}
          value={formatFCFA(totalDebit)}
          icon={TrendingDown}
          color="red"
        />
        <KpiCard
          title={t('comptaTotalCredit')}
          value={formatFCFA(totalCredit)}
          icon={TrendingUp}
          color="green"
        />
        <KpiCard
          title={t('comptaSolde')}
          value={formatFCFA(solde)}
          icon={Scale}
          color={solde >= 0 ? 'blue' : 'orange'}
        />
      </div>

      {/* Journal table */}
      <Card padding={false}>
        <div className="p-5">
          <CardHeader title={t('comptaJournal')} />
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
          </div>
        ) : (
          <DataTable<JournalEntry>
            columns={columns}
            data={(data?.items ?? []) as JournalEntry[]}
            emptyMessage={t('comptaNoData')}
          />
        )}
      </Card>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {data.total} — {tc('page')} {data.page}/{data.pages}
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

      {/* Compte de résultat */}
      <Card>
        <CardHeader title={`${t('comptaJournal')} — ${currentYear}`} />
        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3">
            <span className="text-sm font-medium text-gray-700">{t('comptaTotalCharges')}</span>
            <span className="font-bold text-red-600">{formatFCFA(totalDebit)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
            <span className="text-sm font-medium text-gray-700">{t('comptaTotalProduits')}</span>
            <span className="font-bold text-green-600">{formatFCFA(totalCredit)}</span>
          </div>
          <div
            className={`flex items-center justify-between rounded-lg px-4 py-3 ${
              solde >= 0 ? 'bg-blue-50' : 'bg-orange-50'
            }`}
          >
            <span className="text-sm font-semibold text-gray-800">
              {solde >= 0 ? 'Bénéfice net' : 'Perte nette'}
            </span>
            <span
              className={`text-lg font-bold ${solde >= 0 ? 'text-blue-700' : 'text-orange-700'}`}
            >
              {formatFCFA(Math.abs(solde))}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
