'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import {
  phytoSubcategoryLabels,
  fertiSubcategoryLabels,
  semenceSubcategoryLabels,
  phytoSubcategoryValues,
  fertiSubcategoryValues,
  semenceSubcategoryValues,
  formLabels,
} from '@/lib/validators/input.validator';

type InputCategory = 'phyto' | 'ferti' | 'semence';

interface IntrantListClientProps {
  category: InputCategory;
}

type AssetRow = Record<string, unknown> & {
  id: string;
  name: string;
  data: Record<string, unknown> | null;
};

export function IntrantListClient({ category }: IntrantListClientProps) {
  const router = useRouter();
  const t = useTranslations('intrants');
  const tc = useTranslations('common');
  const [search, setSearch] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [page, setPage] = useState(1);

  const subcategoryFilter = subcategory || undefined;

  const queryBase = { search: search || undefined, page, limit: 25 };

  const phytoQuery = trpc.input.listPhyto.useQuery(
    { ...queryBase, subcategory: subcategoryFilter as unknown as undefined },
    { enabled: category === 'phyto' },
  );
  const fertiQuery = trpc.input.listFerti.useQuery(
    { ...queryBase, subcategory: subcategoryFilter as unknown as undefined },
    { enabled: category === 'ferti' },
  );
  const semenceQuery = trpc.input.listSemence.useQuery(
    { ...queryBase, subcategory: subcategoryFilter as unknown as undefined },
    { enabled: category === 'semence' },
  );

  const activeQuery = category === 'phyto' ? phytoQuery : category === 'ferti' ? fertiQuery : semenceQuery;
  const { data, isLoading } = activeQuery;

  const subcatOptions =
    category === 'phyto'
      ? phytoSubcategoryValues.map((v) => ({ value: v, label: phytoSubcategoryLabels[v] }))
      : category === 'ferti'
        ? fertiSubcategoryValues.map((v) => ({ value: v, label: fertiSubcategoryLabels[v] }))
        : semenceSubcategoryValues.map((v) => ({ value: v, label: semenceSubcategoryLabels[v] }));

  const subcatLabels =
    category === 'phyto' ? phytoSubcategoryLabels
      : category === 'ferti' ? fertiSubcategoryLabels
        : semenceSubcategoryLabels;

  const columns =
    category === 'phyto'
      ? [
          { key: 'name', header: tc('name') },
          {
            key: 'commercial_name',
            header: t('fieldCommercialName'),
            render: (row: AssetRow) => (row.data?.commercial_name as string) ?? '—',
          },
          {
            key: 'active_ingredient',
            header: t('fieldActiveIngredient'),
            render: (row: AssetRow) => (row.data?.active_ingredient as string) ?? '—',
          },
          {
            key: 'subcategory',
            header: t('fieldSubcategory'),
            render: (row: AssetRow) => {
              const sub = (row.data?.input_subcategory as string) ?? '';
              return <Badge>{subcatLabels[sub] ?? sub}</Badge>;
            },
          },
          {
            key: 'form',
            header: t('fieldForm'),
            render: (row: AssetRow) => formLabels[(row.data?.form as string) ?? ''] ?? '—',
          },
        ]
      : category === 'ferti'
        ? [
            { key: 'name', header: tc('name') },
            {
              key: 'commercial_name',
              header: t('fieldCommercialName'),
              render: (row: AssetRow) => (row.data?.commercial_name as string) ?? '—',
            },
            {
              key: 'composition_npk',
              header: t('fieldCompositionNpk'),
              render: (row: AssetRow) => (row.data?.composition_npk as string) ?? '—',
            },
            {
              key: 'subcategory',
              header: t('fieldSubcategory'),
              render: (row: AssetRow) => {
                const sub = (row.data?.input_subcategory as string) ?? '';
                return <Badge>{subcatLabels[sub] ?? sub}</Badge>;
              },
            },
            {
              key: 'form',
              header: t('fieldForm'),
              render: (row: AssetRow) => formLabels[(row.data?.form as string) ?? ''] ?? '—',
            },
          ]
        : [
            { key: 'name', header: tc('name') },
            {
              key: 'variety',
              header: t('fieldVariety'),
              render: (row: AssetRow) => (row.data?.variety as string) ?? '—',
            },
            {
              key: 'lot_number',
              header: t('fieldLotNumber'),
              render: (row: AssetRow) => (row.data?.lot_number as string) ?? '—',
            },
            {
              key: 'germination_rate',
              header: t('fieldGerminationRate'),
              render: (row: AssetRow) => {
                const rate = row.data?.germination_rate as number | undefined;
                return rate != null ? `${rate}%` : '—';
              },
            },
            {
              key: 'certification',
              header: t('fieldCertification'),
              render: (row: AssetRow) => (row.data?.certification as string) ?? '—',
            },
          ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-52">
          <Select
            options={[{ value: '', label: t('selectSubcategory') }, ...subcatOptions]}
            value={subcategory}
            onChange={(e) => {
              setSubcategory(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={(data?.items ?? []) as AssetRow[]}
            emptyMessage={t('emptyMessage')}
            onRowClick={(row) => router.push(`/intrants/${row.id}`)}
          />

          {data && data.pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
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
    </div>
  );
}
