'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import {
  inputCategoryLabels,
  phytoSubcategoryLabels,
  fertiSubcategoryLabels,
  semenceSubcategoryLabels,
  formLabels,
  stockUnitValues,
  stockUnitLabels,
} from '@/lib/validators/input.validator';

interface IntrantDetailClientProps {
  id: string;
}

type MovementRow = Record<string, unknown> & {
  id: string;
  quantity: string;
  unit: string;
  createdAt: string | Date | null;
  logId: string | null;
};

export function IntrantDetailClient({ id }: IntrantDetailClientProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const t = useTranslations('intrants');
  const tc = useTranslations('common');
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustType, setAdjustType] = useState<'increment' | 'decrement'>('increment');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustUnit, setAdjustUnit] = useState('');

  const { data: asset } = trpc.asset.getById.useQuery({ id });
  const { data: stockData } = trpc.inventory.getByAsset.useQuery({ assetId: id });
  const archiveMutation = trpc.asset.archive.useMutation({
    onSuccess: () => router.push('/intrants'),
  });
  const adjustMutation = trpc.inventory.adjust.useMutation({
    onSuccess: () => {
      utils.inventory.getByAsset.invalidate({ assetId: id });
      utils.inventory.kpis.invalidate();
      setShowAdjust(false);
      setAdjustQty('');
    },
  });

  if (!asset || !stockData) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
      </div>
    );
  }

  const data = asset.data as Record<string, unknown> | null;
  const category = (data?.input_category as string) ?? (asset.type === 'seed' ? 'semence' : '');
  const subcategory = (data?.input_subcategory as string) ?? '';

  const allSubcatLabels = { ...phytoSubcategoryLabels, ...fertiSubcategoryLabels, ...semenceSubcategoryLabels };
  const categoryBadgeVariant = category === 'phyto' ? 'warning' : category === 'ferti' ? 'success' : 'info';

  const infoFields: { label: string; value: string | number | undefined }[] = [];

  if (category === 'phyto') {
    infoFields.push(
      { label: t('fieldCommercialName'), value: data?.commercial_name as string },
      { label: t('fieldActiveIngredient'), value: data?.active_ingredient as string },
      { label: t('fieldRecommendedDose'), value: data?.recommended_dose as string },
      { label: t('fieldDar'), value: data?.dar_days as number },
      { label: t('fieldToxicityClass'), value: data?.toxicity_class as string },
      { label: t('fieldForm'), value: formLabels[(data?.form as string) ?? ''] },
    );
  } else if (category === 'ferti') {
    infoFields.push(
      { label: t('fieldCommercialName'), value: data?.commercial_name as string },
      { label: t('fieldCompositionNpk'), value: data?.composition_npk as string },
      { label: t('fieldRecommendedDose'), value: data?.recommended_dose as string },
      { label: t('fieldForm'), value: formLabels[(data?.form as string) ?? ''] },
    );
  } else {
    infoFields.push(
      { label: t('fieldCropType'), value: data?.crop_type as string },
      { label: t('fieldVariety'), value: data?.variety as string },
      { label: t('fieldLotNumber'), value: data?.lot_number as string },
      { label: t('fieldGerminationRate'), value: data?.germination_rate != null ? `${data.germination_rate}%` : undefined },
      { label: t('fieldOrigin'), value: data?.origin as string },
      { label: t('fieldSeedTreatment'), value: data?.seed_treatment as string },
      { label: t('fieldCertification'), value: data?.certification as string },
    );
  }

  const formatXof = (value: number) =>
    new Intl.NumberFormat('fr-SN', { style: 'decimal', maximumFractionDigits: 0 }).format(value) + ' FCFA';

  const movementColumns = [
    {
      key: 'createdAt',
      header: tc('date'),
      render: (row: MovementRow) => {
        const d = row.createdAt ? new Date(row.createdAt) : null;
        return d ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
      },
    },
    {
      key: 'type',
      header: tc('type'),
      render: (row: MovementRow) => {
        const qty = Number(row.quantity);
        return qty >= 0 ? (
          <Badge variant="success">{t('detailEntree')}</Badge>
        ) : (
          <Badge variant="danger">{t('detailSortie')}</Badge>
        );
      },
    },
    {
      key: 'quantity',
      header: tc('quantity'),
      render: (row: MovementRow) => {
        const qty = Number(row.quantity);
        return `${qty >= 0 ? '+' : ''}${qty} ${row.unit}`;
      },
    },
    {
      key: 'logId',
      header: 'Log',
      render: (row: MovementRow) =>
        row.logId ? (
          <button
            className="text-green-600 underline hover:text-green-800"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/logs/${row.logId}`);
            }}
          >
            Voir log
          </button>
        ) : (
          '—'
        ),
    },
  ];

  const isAlert = stockData.stockThreshold > 0 && stockData.currentStock < stockData.stockThreshold;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">{asset.name}</h1>
          <Badge variant={categoryBadgeVariant}>{inputCategoryLabels[category] ?? category}</Badge>
          <Badge>{allSubcatLabels[subcategory] ?? subcategory}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/intrants`)}>
            {tc('back')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => archiveMutation.mutate({ id })}
          >
            {tc('archive')}
          </Button>
        </div>
      </div>

      {/* Info + Stock cards */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Product info card */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">{t('detailProductInfo')}</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">{t('detailCategory')}</dt>
              <dd className="text-sm font-medium text-gray-800">{inputCategoryLabels[category] ?? category}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">{t('detailSubcategory')}</dt>
              <dd className="text-sm font-medium text-gray-800">{allSubcatLabels[subcategory] ?? subcategory}</dd>
            </div>
            {infoFields.map(
              (f) =>
                f.value != null && (
                  <div key={f.label} className="flex justify-between">
                    <dt className="text-sm text-gray-500">{f.label}</dt>
                    <dd className="text-sm font-medium text-gray-800">{f.value}</dd>
                  </div>
                ),
            )}
          </dl>
        </div>

        {/* Stock card */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">{t('detailCurrentStock')}</h2>
          <div className="mb-4 text-center">
            <p className={`text-4xl font-bold ${isAlert ? 'text-red-600' : 'text-green-700'}`}>
              {stockData.currentStock} {stockData.stockUnit}
            </p>
            {isAlert && (
              <p className="mt-1 text-sm text-red-500">
                Stock sous le seuil ({stockData.stockThreshold} {stockData.stockUnit})
              </p>
            )}
          </div>
          <div className="mb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('detailStockThreshold')}</span>
              <span className="font-medium">{stockData.stockThreshold} {stockData.stockUnit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('detailUnitPrice')}</span>
              <span className="font-medium">{formatXof(stockData.unitPriceXof)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('detailValorisation')}</span>
              <span className="font-bold text-green-700">{formatXof(stockData.valorisation)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                setAdjustType('increment');
                setAdjustUnit(stockData.stockUnit);
                setShowAdjust(true);
              }}
            >
              + {t('detailEntree')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAdjustType('decrement');
                setAdjustUnit(stockData.stockUnit);
                setShowAdjust(true);
              }}
            >
              - {t('detailSortie')}
            </Button>
          </div>
        </div>
      </div>

      {/* Movements table */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-700">{t('detailMovementHistory')}</h2>
        <DataTable
          columns={movementColumns}
          data={(stockData.movements ?? []) as MovementRow[]}
          emptyMessage={t('emptyMovements')}
        />
      </div>

      {/* Adjust modal */}
      <Modal
        isOpen={showAdjust}
        onClose={() => setShowAdjust(false)}
        title={adjustType === 'increment' ? t('detailEntree') : t('detailSortie')}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label={tc('quantity')}
            type="number"
            min="0"
            step="0.01"
            value={adjustQty}
            onChange={(e) => setAdjustQty(e.target.value)}
          />
          <Select
            label={tc('unit')}
            options={stockUnitValues.map((u) => ({ value: u, label: stockUnitLabels[u] }))}
            value={adjustUnit}
            onChange={(e) => setAdjustUnit(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAdjust(false)}>
              {tc('cancel')}
            </Button>
            <Button
              size="sm"
              disabled={!adjustQty || Number(adjustQty) <= 0}
              onClick={() => {
                adjustMutation.mutate({
                  assetId: id,
                  quantity: Number(adjustQty),
                  unit: adjustUnit,
                  type: adjustType,
                });
              }}
            >
              {tc('confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
