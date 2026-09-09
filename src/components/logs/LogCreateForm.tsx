'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { createLogSchema } from '@/lib/validators/log.validator';
import type { logTypeValues } from '@/lib/validators/log.validator';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ComboboxAsync, ComboboxAsyncMulti } from '@/components/ui/ComboboxAsync';
import type { z } from 'zod';

type CreateLogInput = z.input<typeof createLogSchema>;

type LogType = (typeof logTypeValues)[number];

const seedRateUnitOptions = [
  { value: 'kg_ha', label: 'kg/ha' },
  { value: 'plants_ha', label: 'plants/ha' },
];

interface AssetItem {
  id: string;
  name: string;
  type: string;
  data: Record<string, unknown> | null;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
}

interface LogCreateFormProps {
  defaultType?: LogType;
}

export function LogCreateForm({ defaultType }: LogCreateFormProps) {
  const router = useRouter();
  const t = useTranslations('logs');
  const tc = useTranslations('common');
  const [equipmentIds, setEquipmentIds] = useState<string[]>([]);
  const [workerIds, setWorkerIds] = useState<string[]>([]);

  const typeOptions = [
    { value: 'activity', label: t('typeActivity') },
    { value: 'observation', label: t('typeObservation') },
    { value: 'input', label: t('typeInput') },
    { value: 'harvest', label: t('typeHarvest') },
    { value: 'seeding', label: t('typeSeeding') },
    { value: 'transplanting', label: t('typeTransplanting') },
    { value: 'birth', label: t('typeBirth') },
    { value: 'maintenance', label: t('typeMaintenance') },
    { value: 'medical', label: t('typeMedical') },
    { value: 'lab_test', label: t('typeLabTest') },
    { value: 'movement', label: t('typeMovement') },
    { value: 'irrigation', label: t('typeIrrigation') },
  ];

  const statusOptions = [
    { value: 'pending', label: t('statusPending') },
    { value: 'done', label: t('statusDone') },
    { value: 'cancelled', label: t('statusCancelled') },
  ];

  const measureOptions = [
    { value: 'count', label: t('measureCount') },
    { value: 'weight', label: t('measureWeight') },
    { value: 'volume', label: t('measureVolume') },
    { value: 'length', label: t('measureLength') },
    { value: 'area', label: t('measureArea') },
    { value: 'rate', label: t('measureRate') },
  ];

  const createMutation = trpc.log.create.useMutation({
    onSuccess: (data) => {
      router.push(`/logs/${data.id}`);
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<CreateLogInput>({
    resolver: zodResolver(createLogSchema),
    defaultValues: {
      type: defaultType ?? 'activity',
      name: '',
      timestamp: new Date().toISOString().slice(0, 16),
      status: 'pending',
      data: {},
      equipmentIds: [],
      workerIds: [],
      quantities: [],
    },
  });

  const { fields: quantityFields, append: appendQuantity, remove: removeQuantity } = useFieldArray({
    control,
    name: 'quantities',
  });

  const selectedType = watch('type');
  const sowingType = watch('data.sowing_type' as any);

  // Search functions for ComboboxAsync
  const searchEquipment = async (query: string): Promise<AssetItem[]> => {
    const res = await fetch(`/api/trpc/asset.list?input=${encodeURIComponent(JSON.stringify({ json: { type: 'equipment', search: query || undefined, page: 1, limit: 20 } }))}`);
    const json = await res.json();
    return json?.result?.data?.json?.items ?? [];
  };

  const searchSeeder = async (query: string): Promise<AssetItem[]> => {
    const items = await searchEquipment(query);
    return items.filter((item) => {
      const eqType = (item.data as Record<string, unknown>)?.equipment_type as string | undefined;
      return eqType && ['semoir', 'planteuse', 'semoir_pneumatique'].includes(eqType);
    });
  };

  const searchSeed = async (query: string): Promise<AssetItem[]> => {
    const res = await fetch(`/api/trpc/asset.list?input=${encodeURIComponent(JSON.stringify({ json: { type: 'seed', search: query || undefined, page: 1, limit: 20 } }))}`);
    const json = await res.json();
    return json?.result?.data?.json?.items ?? [];
  };

  const searchLand = async (query: string): Promise<AssetItem[]> => {
    const res = await fetch(`/api/trpc/asset.list?input=${encodeURIComponent(JSON.stringify({ json: { type: 'land', search: query || undefined, page: 1, limit: 20 } }))}`);
    const json = await res.json();
    return json?.result?.data?.json?.items ?? [];
  };

  const searchWorkers = async (_query: string): Promise<UserItem[]> => {
    // TODO: integrate with user.list when available
    return [];
  };

  const onSubmit = (values: CreateLogInput) => {
    createMutation.mutate({
      ...values,
      equipmentIds,
      workerIds,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* General info */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionGeneral')}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t('fieldLogType')}
            options={typeOptions}
            error={errors.type?.message}
            {...register('type')}
          />
          <Input
            label={t('fieldName')}
            placeholder="Ex: Semis parcelle Nord"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label={t('fieldDatetime')}
            type="datetime-local"
            error={errors.timestamp?.message}
            {...register('timestamp')}
          />
          <Select
            label={t('fieldStatus')}
            options={statusOptions}
            error={errors.status?.message}
            {...register('status')}
          />
        </div>
        <div className="mt-4">
          <Input
            label={t('fieldNotes')}
            placeholder={tc('notes')}
            error={errors.notes?.message}
            {...register('notes')}
          />
        </div>
      </Card>

      {/* Seeding enrichi */}
      {selectedType === 'seeding' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionSeeding')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Type de semis */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fieldSowingType')}</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    value="manual"
                    {...register('data.sowing_type' as any)}
                    className="text-green-600 focus:ring-green-500"
                  />
                  {t('sowingManual')}
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    value="machine"
                    {...register('data.sowing_type' as any)}
                    className="text-green-600 focus:ring-green-500"
                  />
                  {t('sowingMachine')}
                </label>
              </div>
            </div>

            {/* Machine selection — only if sowing_type = machine */}
            {sowingType === 'machine' && (
              <Controller
                control={control}
                name={'data.machine_id' as any}
                render={({ field }) => (
                  <ComboboxAsync<AssetItem>
                    label={t('fieldMachine')}
                    value={field.value as string}
                    onChange={field.onChange}
                    searchFn={searchSeeder}
                    getLabel={(item) => `${item.name} — ${(item.data as any)?.equipment_type ?? ''}`}
                    getValue={(item) => item.id}
                    error={(errors.data as any)?.machine_id?.message}
                  />
                )}
              />
            )}

            {/* Seed selection */}
            <Controller
              control={control}
              name={'data.seed_id' as any}
              render={({ field }) => (
                <ComboboxAsync<AssetItem>
                  label={t('fieldSeed')}
                  value={field.value as string}
                  onChange={field.onChange}
                  searchFn={searchSeed}
                  getLabel={(item) => `${item.name} — ${(item.data as any)?.variety ?? ''}`}
                  getValue={(item) => item.id}
                />
              )}
            />

            {/* Target parcel */}
            <Controller
              control={control}
              name={'data.target_parcel_id' as any}
              render={({ field }) => (
                <ComboboxAsync<AssetItem>
                  label={t('fieldTargetParcel')}
                  value={field.value as string}
                  onChange={field.onChange}
                  searchFn={searchLand}
                  getLabel={(item) => `${item.name} — ${(item.data as any)?.code_parcelle ?? ''}`}
                  getValue={(item) => item.id}
                />
              )}
            />

            <Input
              label={t('fieldSeedDepth')}
              type="number"
              step="0.1"
              min="0"
              placeholder="Ex: 3"
              {...register('data.seed_depth_cm' as any, { valueAsNumber: true })}
            />
            <Input
              label={t('fieldRowSpacing')}
              type="number"
              step="0.1"
              min="0"
              placeholder="Ex: 75"
              {...register('data.row_spacing_cm' as any, { valueAsNumber: true })}
            />
            <Input
              label={t('fieldPlantSpacing')}
              type="number"
              step="0.1"
              min="0"
              placeholder="Ex: 25"
              {...register('data.plant_spacing_cm' as any, { valueAsNumber: true })}
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label={t('fieldSeedRate')}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ex: 120"
                  {...register('data.seed_rate_kg_ha' as any, { valueAsNumber: true })}
                />
              </div>
              <div className="w-36">
                <Select
                  label={t('fieldSeedRateUnit')}
                  options={seedRateUnitOptions}
                  {...register('data.seed_rate_unit' as any)}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Activity fields */}
      {selectedType === 'activity' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionActivity')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('fieldDuration')}
              type="number"
              step="0.5"
              min="0"
              {...register('data.duration_hours' as any, { valueAsNumber: true })}
            />
            <Input
              label={t('fieldDescription')}
              {...register('data.description' as any)}
            />
          </div>
        </Card>
      )}

      {/* Harvest fields */}
      {selectedType === 'harvest' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionHarvest')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('fieldYieldKg')}
              type="number"
              step="0.1"
              {...register('data.yield_kg' as any, { valueAsNumber: true })}
            />
            <Input
              label={t('fieldYieldPerHa')}
              type="number"
              step="0.1"
              {...register('data.yield_per_ha' as any, { valueAsNumber: true })}
            />
            <Select
              label={t('fieldQuality')}
              options={[
                { value: 'A', label: t('gradeA') },
                { value: 'B', label: t('gradeB') },
                { value: 'C', label: t('gradeC') },
              ]}
              {...register('data.quality_grade' as any)}
            />
            <Input
              label={t('fieldDestination')}
              {...register('data.destination' as any)}
            />
            <Input
              label={t('fieldPricePerKg')}
              type="number"
              {...register('data.price_per_kg_xof' as any, { valueAsNumber: true })}
            />
          </div>
        </Card>
      )}

      {/* Input (intrant) fields */}
      {selectedType === 'input' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionInput')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={t('fieldInputType')}
              options={[
                { value: 'phyto', label: t('inputTypePhyto') },
                { value: 'ferti', label: t('inputTypeFerti') },
                { value: 'semence', label: t('inputTypeSemence') },
              ]}
              {...register('data.input_type' as any)}
            />
            <Input
              label={t('fieldInputSubcat')}
              {...register('data.input_subcategory' as any)}
            />
            <Input
              label={t('fieldDose')}
              type="number"
              step="0.01"
              {...register('data.dose' as any, { valueAsNumber: true })}
            />
            <Input
              label={t('fieldDoseUnit')}
              placeholder="Ex: L/ha"
              {...register('data.dose_unit' as any)}
            />
            <Input
              label={t('fieldMethod')}
              {...register('data.method' as any)}
            />
            <Input
              label={t('fieldTreatedSurface')}
              type="number"
              step="0.01"
              {...register('data.treated_surface_ha' as any, { valueAsNumber: true })}
            />
          </div>
        </Card>
      )}

      {/* Maintenance fields */}
      {selectedType === 'maintenance' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionMaintenance')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('fieldMaintenanceType')}
              {...register('data.maintenance_type' as any)}
            />
            <Input
              label={t('fieldCost')}
              type="number"
              {...register('data.cost_xof' as any, { valueAsNumber: true })}
            />
          </div>
        </Card>
      )}

      {/* Medical fields */}
      {selectedType === 'medical' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionMedical')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('fieldTreatment')}
              {...register('data.treatment' as any)}
            />
            <Input
              label={t('fieldVeterinarian')}
              {...register('data.veterinarian' as any)}
            />
          </div>
        </Card>
      )}

      {/* Birth fields */}
      {selectedType === 'birth' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionBirth')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={t('fieldSex')}
              options={[
                { value: '', label: t('sexUnspecified') },
                { value: 'male', label: t('sexMale') },
                { value: 'female', label: t('sexFemale') },
              ]}
              {...register('data.sex' as any)}
            />
            <Input
              label={t('fieldWeight')}
              type="number"
              step="0.1"
              {...register('data.weight_kg' as any, { valueAsNumber: true })}
            />
          </div>
        </Card>
      )}

      {/* Transplanting fields */}
      {selectedType === 'transplanting' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionTransplanting')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('fieldSourceNursery')}
              {...register('data.source_nursery' as any)}
            />
            <Input
              label={t('fieldPlantAge')}
              type="number"
              {...register('data.plant_age_days' as any, { valueAsNumber: true })}
            />
          </div>
        </Card>
      )}

      {/* Irrigation fields */}
      {selectedType === 'irrigation' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionIrrigation')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('fieldIrrigationMethod')}
              {...register('data.method' as any)}
            />
            <Input
              label={t('fieldIrrigationDuration')}
              type="number"
              {...register('data.duration_min' as any, { valueAsNumber: true })}
            />
            <Input
              label={t('fieldVolume')}
              type="number"
              {...register('data.volume_liters' as any, { valueAsNumber: true })}
            />
          </div>
        </Card>
      )}

      {/* Movement fields */}
      {selectedType === 'movement' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionMovement')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('fieldFromLocation')}
              {...register('data.from_location' as any)}
            />
            <Input
              label={t('fieldToLocation')}
              {...register('data.to_location' as any)}
            />
            <Input
              label={t('fieldQuantityMov')}
              type="number"
              step="0.01"
              {...register('data.quantity' as any, { valueAsNumber: true })}
            />
          </div>
        </Card>
      )}

      {/* Lab test fields */}
      {selectedType === 'lab_test' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionLabTest')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('fieldSampleType')}
              {...register('data.sample_type' as any)}
            />
          </div>
        </Card>
      )}

      {/* Equipment & Worker assignment — for ALL log types */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionAssignment')}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <ComboboxAsyncMulti<AssetItem>
            label={t('fieldEquipment')}
            value={equipmentIds}
            onChange={setEquipmentIds}
            searchFn={searchEquipment}
            getLabel={(item) => item.name}
            getValue={(item) => item.id}
          />
          <ComboboxAsyncMulti<UserItem>
            label={t('fieldWorkers')}
            value={workerIds}
            onChange={setWorkerIds}
            searchFn={searchWorkers}
            getLabel={(item) => item.name}
            getValue={(item) => item.id}
          />
        </div>
      </Card>

      {/* Quantities */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{t('formSectionQuantities')}</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendQuantity({
                measure: 'weight',
                numerator: 0,
                denominator: 1,
                unit: 'kg',
                label: '',
              })
            }
          >
            <Plus className="h-4 w-4" />
            {t('addMeasure')}
          </Button>
        </div>

        {quantityFields.length === 0 && (
          <p className="text-sm text-gray-400">{t('noMeasure')}</p>
        )}

        {quantityFields.map((field, index) => (
          <div key={field.id} className="mb-3 grid grid-cols-12 items-end gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="col-span-3">
              <Select
                label={index === 0 ? t('colMeasure') : undefined}
                options={measureOptions}
                {...register(`quantities.${index}.measure`)}
              />
            </div>
            <div className="col-span-2">
              <Input
                label={index === 0 ? t('colValue') : undefined}
                type="number"
                {...register(`quantities.${index}.numerator`, { valueAsNumber: true })}
              />
            </div>
            <div className="col-span-2">
              <Input
                label={index === 0 ? t('colUnit') : undefined}
                placeholder="kg, L, m..."
                {...register(`quantities.${index}.unit`)}
              />
            </div>
            <div className="col-span-4">
              <Input
                label={index === 0 ? t('colLabel') : undefined}
                {...register(`quantities.${index}.label`)}
              />
            </div>
            <div className="col-span-1">
              <button
                type="button"
                onClick={() => removeQuantity(index)}
                className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tc('cancel')}
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? tc('creating') : t('createButton')}
        </Button>
      </div>

      {createMutation.isError && (
        <p className="text-sm text-red-500">{tc('error')}: {createMutation.error.message}</p>
      )}
    </form>
  );
}
