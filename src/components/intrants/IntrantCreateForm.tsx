'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  inputCategoryValues,
  inputCategoryLabels,
  phytoSubcategoryValues,
  phytoSubcategoryLabels,
  fertiSubcategoryValues,
  fertiSubcategoryLabels,
  semenceSubcategoryValues,
  semenceSubcategoryLabels,
  formValues,
  formLabels,
  stockUnitValues,
  stockUnitLabels,
  type CreateInputValues,
} from '@/lib/validators/input.validator';

export function IntrantCreateForm() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const t = useTranslations('intrants');
  const tc = useTranslations('common');

  const [category, setCategory] = useState<'phyto' | 'ferti' | 'semence' | ''>('');
  const [formState, setFormState] = useState<Record<string, string>>({
    stockUnit: 'kg',
    stockInitial: '0',
    unitPriceXof: '0',
    stockThreshold: '0',
  });
  const [error, setError] = useState('');

  const createMutation = trpc.input.create.useMutation({
    onSuccess: () => {
      utils.inventory.kpis.invalidate();
      router.push('/intrants');
    },
    onError: (err) => setError(err.message),
  });

  const set = (key: string, value: string) => setFormState((s) => ({ ...s, [key]: value }));

  const subcatOptions =
    category === 'phyto'
      ? phytoSubcategoryValues.map((v) => ({ value: v, label: phytoSubcategoryLabels[v] }))
      : category === 'ferti'
        ? fertiSubcategoryValues.map((v) => ({ value: v, label: fertiSubcategoryLabels[v] }))
        : category === 'semence'
          ? semenceSubcategoryValues.map((v) => ({ value: v, label: semenceSubcategoryLabels[v] }))
          : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!category) {
      setError(t('selectCategory'));
      return;
    }

    const base = {
      name: formState.name ?? '',
      stockInitial: Number(formState.stockInitial ?? 0),
      stockUnit: (formState.stockUnit ?? 'kg') as CreateInputValues['stockUnit'],
      unitPriceXof: Number(formState.unitPriceXof ?? 0),
      stockThreshold: Number(formState.stockThreshold ?? 0),
      notes: formState.notes || undefined,
    };

    let payload: CreateInputValues;

    if (category === 'phyto') {
      payload = {
        ...base,
        inputCategory: 'phyto',
        inputSubcategory: formState.inputSubcategory as CreateInputValues & { inputCategory: 'phyto' } extends { inputSubcategory: infer S } ? S : never,
        commercialName: formState.commercialName ?? '',
        activeIngredient: formState.activeIngredient || undefined,
        recommendedDose: formState.recommendedDose || undefined,
        darDays: formState.darDays ? Number(formState.darDays) : undefined,
        toxicityClass: formState.toxicityClass || undefined,
        form: (formState.form as 'liquide' | 'granule' | 'poudre' | 'suspension') || undefined,
      };
    } else if (category === 'ferti') {
      payload = {
        ...base,
        inputCategory: 'ferti',
        inputSubcategory: formState.inputSubcategory as CreateInputValues & { inputCategory: 'ferti' } extends { inputSubcategory: infer S } ? S : never,
        commercialName: formState.commercialName ?? '',
        compositionNpk: formState.compositionNpk || undefined,
        recommendedDose: formState.recommendedDose || undefined,
        form: (formState.form as 'liquide' | 'granule' | 'poudre' | 'suspension') || undefined,
      };
    } else {
      payload = {
        ...base,
        inputCategory: 'semence',
        inputSubcategory: formState.inputSubcategory as CreateInputValues & { inputCategory: 'semence' } extends { inputSubcategory: infer S } ? S : never,
        cropType: formState.cropType ?? '',
        variety: formState.variety || undefined,
        lotNumber: formState.lotNumber || undefined,
        germinationRate: formState.germinationRate ? Number(formState.germinationRate) : undefined,
        origin: formState.origin || undefined,
        seedTreatment: formState.seedTreatment || undefined,
        certification: formState.certification || undefined,
      };
    }

    createMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Step 1 — Category */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-700">{t('step1Category')}</h2>
        <Select
          label={t('fieldCategory')}
          options={inputCategoryValues.map((v) => ({ value: v, label: inputCategoryLabels[v] }))}
          value={category}
          placeholder={t('selectCategory')}
          onChange={(e) => {
            setCategory(e.target.value as 'phyto' | 'ferti' | 'semence');
            setFormState((s) => ({ ...s, inputSubcategory: '' }));
          }}
        />
      </div>

      {category && (
        <>
          {/* Step 2 — Subcategory */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-700">{t('step2Subcategory')}</h2>
            <Select
              label={t('fieldSubcategory')}
              options={subcatOptions}
              value={formState.inputSubcategory ?? ''}
              placeholder={t('selectSubcategory')}
              onChange={(e) => set('inputSubcategory', e.target.value)}
            />
          </div>

          {/* Step 3 — Specific fields */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-700">{t('step3Information')}</h2>
            <div className="space-y-4">
              <Input
                label={t('fieldName')}
                value={formState.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                required
              />

              {category === 'phyto' && (
                <>
                  <Input
                    label={t('fieldCommercialName')}
                    value={formState.commercialName ?? ''}
                    onChange={(e) => set('commercialName', e.target.value)}
                    required
                  />
                  <Input
                    label={t('fieldActiveIngredient')}
                    value={formState.activeIngredient ?? ''}
                    onChange={(e) => set('activeIngredient', e.target.value)}
                  />
                  <Input
                    label={t('fieldRecommendedDose')}
                    value={formState.recommendedDose ?? ''}
                    onChange={(e) => set('recommendedDose', e.target.value)}
                    helperText="Ex: 0.5 L/ha"
                  />
                  <Input
                    label={t('fieldDar')}
                    type="number"
                    min="0"
                    value={formState.darDays ?? ''}
                    onChange={(e) => set('darDays', e.target.value)}
                  />
                  <Select
                    label={t('fieldToxicityClass')}
                    options={[
                      { value: 'I', label: 'Classe I' },
                      { value: 'II', label: 'Classe II' },
                      { value: 'III', label: 'Classe III' },
                      { value: 'IV', label: 'Classe IV' },
                    ]}
                    value={formState.toxicityClass ?? ''}
                    placeholder={t('selectChoose')}
                    onChange={(e) => set('toxicityClass', e.target.value)}
                  />
                  <Select
                    label={t('fieldForm')}
                    options={formValues.map((v) => ({ value: v, label: formLabels[v] }))}
                    value={formState.form ?? ''}
                    placeholder={t('selectChoose')}
                    onChange={(e) => set('form', e.target.value)}
                  />
                </>
              )}

              {category === 'ferti' && (
                <>
                  <Input
                    label={t('fieldCommercialName')}
                    value={formState.commercialName ?? ''}
                    onChange={(e) => set('commercialName', e.target.value)}
                    required
                  />
                  <Input
                    label={t('fieldCompositionNpk')}
                    value={formState.compositionNpk ?? ''}
                    onChange={(e) => set('compositionNpk', e.target.value)}
                    helperText="Ex: 15-15-15"
                  />
                  <Input
                    label={t('fieldRecommendedDose')}
                    value={formState.recommendedDose ?? ''}
                    onChange={(e) => set('recommendedDose', e.target.value)}
                  />
                  <Select
                    label={t('fieldForm')}
                    options={formValues.map((v) => ({ value: v, label: formLabels[v] }))}
                    value={formState.form ?? ''}
                    placeholder={t('selectChoose')}
                    onChange={(e) => set('form', e.target.value)}
                  />
                </>
              )}

              {category === 'semence' && (
                <>
                  <Input
                    label={t('fieldCropType')}
                    value={formState.cropType ?? ''}
                    onChange={(e) => set('cropType', e.target.value)}
                    required
                  />
                  <Input
                    label={t('fieldVariety')}
                    value={formState.variety ?? ''}
                    onChange={(e) => set('variety', e.target.value)}
                  />
                  <Input
                    label={t('fieldLotNumber')}
                    value={formState.lotNumber ?? ''}
                    onChange={(e) => set('lotNumber', e.target.value)}
                  />
                  <Input
                    label={t('fieldGerminationRate')}
                    type="number"
                    min="0"
                    max="100"
                    value={formState.germinationRate ?? ''}
                    onChange={(e) => set('germinationRate', e.target.value)}
                  />
                  <Input
                    label={t('fieldOrigin')}
                    value={formState.origin ?? ''}
                    onChange={(e) => set('origin', e.target.value)}
                  />
                  <Input
                    label={t('fieldSeedTreatment')}
                    value={formState.seedTreatment ?? ''}
                    onChange={(e) => set('seedTreatment', e.target.value)}
                  />
                  <Select
                    label={t('fieldCertification')}
                    options={[
                      { value: 'certifiee', label: t('subcatSemenceCertifiee') },
                      { value: 'paysanne', label: t('subcatSemencePaysanne') },
                    ]}
                    value={formState.certification ?? ''}
                    placeholder={t('selectChoose')}
                    onChange={(e) => set('certification', e.target.value)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Stock fields */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-700">{t('step4Stock')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('fieldStockInitial')}
                type="number"
                min="0"
                step="0.01"
                value={formState.stockInitial ?? '0'}
                onChange={(e) => set('stockInitial', e.target.value)}
              />
              <Select
                label={t('fieldUnit')}
                options={stockUnitValues.map((v) => ({ value: v, label: stockUnitLabels[v] }))}
                value={formState.stockUnit ?? 'kg'}
                onChange={(e) => set('stockUnit', e.target.value)}
              />
              <Input
                label={t('fieldUnitPrice')}
                type="number"
                min="0"
                value={formState.unitPriceXof ?? '0'}
                onChange={(e) => set('unitPriceXof', e.target.value)}
              />
              <Input
                label={t('fieldStockThreshold')}
                type="number"
                min="0"
                step="0.01"
                value={formState.stockThreshold ?? '0'}
                onChange={(e) => set('stockThreshold', e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-700">{tc('notes')}</h2>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              rows={3}
              value={formState.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => router.push('/intrants')}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? tc('creating') : t('createButton')}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
