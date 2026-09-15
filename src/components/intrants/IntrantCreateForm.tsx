'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
      setError('Veuillez choisir une categorie');
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
        ddrDays: formState.ddrDays ? Number(formState.ddrDays) : undefined,
        toxicityClass: formState.toxicityClass || undefined,
        form: (formState.form as 'liquide' | 'granule' | 'poudre' | 'suspension') || undefined,
        doseMin: formState.doseMin ? Number(formState.doseMin) : undefined,
        doseMax: formState.doseMax ? Number(formState.doseMax) : undefined,
        doseUnit: formState.doseUnit || undefined,
        maxApplicationsPerCycle: formState.maxApplicationsPerCycle ? Number(formState.maxApplicationsPerCycle) : undefined,
        targetOrganisms: formState.targetOrganisms || undefined,
        targetCrops: formState.targetCrops || undefined,
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
        <h2 className="mb-4 text-lg font-semibold text-gray-700">1. Categorie</h2>
        <Select
          label="Type d'intrant"
          options={inputCategoryValues.map((v) => ({ value: v, label: inputCategoryLabels[v] }))}
          value={category}
          placeholder="Choisir une categorie"
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
            <h2 className="mb-4 text-lg font-semibold text-gray-700">2. Sous-categorie</h2>
            <Select
              label="Sous-categorie"
              options={subcatOptions}
              value={formState.inputSubcategory ?? ''}
              placeholder="Choisir une sous-categorie"
              onChange={(e) => set('inputSubcategory', e.target.value)}
            />
          </div>

          {/* Step 3 — Specific fields */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-700">3. Informations</h2>
            <div className="space-y-4">
              <Input
                label="Nom"
                value={formState.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                required
              />

              {category === 'phyto' && (
                <>
                  <Input
                    label="Nom commercial"
                    value={formState.commercialName ?? ''}
                    onChange={(e) => set('commercialName', e.target.value)}
                    required
                  />
                  <Input
                    label="Matiere active"
                    value={formState.activeIngredient ?? ''}
                    onChange={(e) => set('activeIngredient', e.target.value)}
                  />
                  <Input
                    label="Dose recommandee"
                    value={formState.recommendedDose ?? ''}
                    onChange={(e) => set('recommendedDose', e.target.value)}
                    helperText="Ex: 0.5 L/ha"
                  />
                  <Input
                    label="DAR (jours)"
                    type="number"
                    min="0"
                    value={formState.darDays ?? ''}
                    onChange={(e) => set('darDays', e.target.value)}
                  />
                  <Input
                    label="DDR - Delai de reentree (jours)"
                    type="number"
                    min="0"
                    value={formState.ddrDays ?? ''}
                    onChange={(e) => set('ddrDays', e.target.value)}
                  />
                  <Select
                    label="Classe toxicite"
                    options={[
                      { value: 'I', label: 'Classe I' },
                      { value: 'II', label: 'Classe II' },
                      { value: 'III', label: 'Classe III' },
                      { value: 'IV', label: 'Classe IV' },
                    ]}
                    value={formState.toxicityClass ?? ''}
                    placeholder="Choisir"
                    onChange={(e) => set('toxicityClass', e.target.value)}
                  />
                  <Select
                    label="Forme"
                    options={formValues.map((v) => ({ value: v, label: formLabels[v] }))}
                    value={formState.form ?? ''}
                    placeholder="Choisir"
                    onChange={(e) => set('form', e.target.value)}
                  />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Input
                      label="Dose minimale"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formState.doseMin ?? ''}
                      onChange={(e) => set('doseMin', e.target.value)}
                    />
                    <Input
                      label="Dose maximale"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formState.doseMax ?? ''}
                      onChange={(e) => set('doseMax', e.target.value)}
                    />
                    <Input
                      label="Unite dose"
                      value={formState.doseUnit ?? ''}
                      onChange={(e) => set('doseUnit', e.target.value)}
                      helperText="Ex: L/ha, kg/ha"
                    />
                  </div>
                  <Input
                    label="Nb max applications par cycle"
                    type="number"
                    min="1"
                    value={formState.maxApplicationsPerCycle ?? ''}
                    onChange={(e) => set('maxApplicationsPerCycle', e.target.value)}
                  />
                  <Input
                    label="Organismes cibles"
                    value={formState.targetOrganisms ?? ''}
                    onChange={(e) => set('targetOrganisms', e.target.value)}
                    helperText="Ex: pucerons, mildiou, rouille (separes par virgules)"
                  />
                  <Input
                    label="Cultures homologuees"
                    value={formState.targetCrops ?? ''}
                    onChange={(e) => set('targetCrops', e.target.value)}
                    helperText="Ex: tomate, oignon, riz (separes par virgules)"
                  />
                </>
              )}

              {category === 'ferti' && (
                <>
                  <Input
                    label="Nom commercial"
                    value={formState.commercialName ?? ''}
                    onChange={(e) => set('commercialName', e.target.value)}
                    required
                  />
                  <Input
                    label="Composition NPK"
                    value={formState.compositionNpk ?? ''}
                    onChange={(e) => set('compositionNpk', e.target.value)}
                    helperText="Ex: 15-15-15"
                  />
                  <Input
                    label="Dose recommandee"
                    value={formState.recommendedDose ?? ''}
                    onChange={(e) => set('recommendedDose', e.target.value)}
                  />
                  <Select
                    label="Forme"
                    options={formValues.map((v) => ({ value: v, label: formLabels[v] }))}
                    value={formState.form ?? ''}
                    placeholder="Choisir"
                    onChange={(e) => set('form', e.target.value)}
                  />
                </>
              )}

              {category === 'semence' && (
                <>
                  <Input
                    label="Culture"
                    value={formState.cropType ?? ''}
                    onChange={(e) => set('cropType', e.target.value)}
                    required
                  />
                  <Input
                    label="Variete"
                    value={formState.variety ?? ''}
                    onChange={(e) => set('variety', e.target.value)}
                  />
                  <Input
                    label="N° lot"
                    value={formState.lotNumber ?? ''}
                    onChange={(e) => set('lotNumber', e.target.value)}
                  />
                  <Input
                    label="Taux de germination (%)"
                    type="number"
                    min="0"
                    max="100"
                    value={formState.germinationRate ?? ''}
                    onChange={(e) => set('germinationRate', e.target.value)}
                  />
                  <Input
                    label="Provenance"
                    value={formState.origin ?? ''}
                    onChange={(e) => set('origin', e.target.value)}
                  />
                  <Input
                    label="Traitement semence"
                    value={formState.seedTreatment ?? ''}
                    onChange={(e) => set('seedTreatment', e.target.value)}
                  />
                  <Select
                    label="Certification"
                    options={[
                      { value: 'certifiee', label: 'Certifiee' },
                      { value: 'paysanne', label: 'Paysanne' },
                    ]}
                    value={formState.certification ?? ''}
                    placeholder="Choisir"
                    onChange={(e) => set('certification', e.target.value)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Stock fields */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-700">4. Stock & prix</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Stock initial"
                type="number"
                min="0"
                step="0.01"
                value={formState.stockInitial ?? '0'}
                onChange={(e) => set('stockInitial', e.target.value)}
              />
              <Select
                label="Unite"
                options={stockUnitValues.map((v) => ({ value: v, label: stockUnitLabels[v] }))}
                value={formState.stockUnit ?? 'kg'}
                onChange={(e) => set('stockUnit', e.target.value)}
              />
              <Input
                label="Prix unitaire (XOF)"
                type="number"
                min="0"
                value={formState.unitPriceXof ?? '0'}
                onChange={(e) => set('unitPriceXof', e.target.value)}
              />
              <Input
                label="Seuil d'alerte"
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
            <h2 className="mb-4 text-lg font-semibold text-gray-700">Notes</h2>
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
              Annuler
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creation...' : "Creer l'intrant"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
