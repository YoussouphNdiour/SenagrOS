'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { createAssetSchema } from '@/lib/validators/asset.validator';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { z } from 'zod';

type CreateAssetInput = z.infer<typeof createAssetSchema>;

interface AssetCreateFormProps {
  farmId: string;
}

export function AssetCreateForm({ farmId }: AssetCreateFormProps) {
  const router = useRouter();
  const t = useTranslations('assets');
  const tc = useTranslations('common');

  const typeOptions = [
    { value: 'land', label: t('typeLand') },
    { value: 'plant', label: t('typePlant') },
    { value: 'animal', label: t('typeAnimal') },
    { value: 'equipment', label: t('typeEquipment') },
    { value: 'structure', label: t('typeStructure') },
    { value: 'material', label: t('typeMaterial') },
    { value: 'sensor', label: t('typeSensor') },
    { value: 'water', label: t('typeWater') },
    { value: 'seed', label: t('typeSeed') },
    { value: 'product', label: t('typeProduct') },
    { value: 'compost', label: t('typeCompost') },
    { value: 'group', label: t('typeGroup') },
  ];

  const createMutation = trpc.asset.create.useMutation({
    onSuccess: (data) => {
      router.push(`/assets/${data.id}`);
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateAssetInput>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: {
      farmId,
      type: 'land',
      name: '',
      isLocation: false,
      isFixed: false,
    },
  });

  const selectedType = watch('type');

  const onSubmit = (values: CreateAssetInput) => {
    createMutation.mutate(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionGeneral')}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t('fieldType')}
            options={typeOptions}
            error={errors.type?.message}
            {...register('type')}
          />
          <Input
            label={t('fieldName')}
            placeholder={t('namePlaceholder')}
            error={errors.name?.message}
            {...register('name')}
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

        <div className="mt-4 flex gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" {...register('isLocation')} className="rounded" />
            {t('fieldIsLocation')}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" {...register('isFixed')} className="rounded" />
            {t('fieldIsFixed')}
          </label>
        </div>
      </Card>

      {/* Type-specific data fields */}
      {selectedType === 'land' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionLand')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('fieldSurface')}
              type="number"
              step="0.01"
              placeholder="Ex: 2.30"
              {...register('data.surface_ha' as any)}
            />
            <Input
              label={t('fieldSoilType')}
              placeholder="Ex: argileux"
              {...register('data.soil_type' as any)}
            />
            <Input
              label={t('fieldIrrigationType')}
              placeholder="Ex: goutte_a_goutte"
              {...register('data.irrigation_type' as any)}
            />
            <Input
              label={t('fieldCodeParcelle')}
              placeholder="Ex: 2P5D2-5374"
              {...register('data.code_parcelle' as any)}
            />
            <Input
              label={t('fieldIlot')}
              placeholder="Ex: DIAMA"
              {...register('data.ilot' as any)}
            />
          </div>
        </Card>
      )}

      {selectedType === 'plant' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionPlant')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('fieldCropType')}
              placeholder="Ex: haricot_vert"
              {...register('data.crop_type' as any)}
            />
            <Input
              label={t('fieldVariety')}
              placeholder="Ex: Euforia"
              {...register('data.variety' as any)}
            />
            <Input
              label={t('fieldPlantingDate')}
              type="date"
              {...register('data.planting_date' as any)}
            />
            <Input
              label={t('fieldExpectedHarvestDate')}
              type="date"
              {...register('data.expected_harvest_date' as any)}
            />
            <Input
              label={t('fieldRowSpacing')}
              type="number"
              {...register('data.row_spacing_cm' as any)}
            />
            <Input
              label={t('fieldPlantSpacing')}
              type="number"
              {...register('data.plant_spacing_cm' as any)}
            />
            <Input
              label={t('fieldDensity')}
              type="number"
              {...register('data.density_plants_ha' as any)}
            />
          </div>
        </Card>
      )}

      {selectedType === 'equipment' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionEquipment')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('fieldEquipmentType')}
              placeholder="Ex: semoir"
              {...register('data.equipment_type' as any)}
            />
            <Input
              label={t('fieldBrand')}
              placeholder="Ex: John Deere"
              {...register('data.brand' as any)}
            />
            <Input
              label={t('fieldModel')}
              placeholder="Ex: 1750"
              {...register('data.model' as any)}
            />
            <Input
              label={t('fieldSerialNumber')}
              {...register('data.serial_number' as any)}
            />
            <Input
              label={t('fieldPurchaseDate')}
              type="date"
              {...register('data.purchase_date' as any)}
            />
            <Input
              label={t('fieldPurchasePrice')}
              type="number"
              {...register('data.purchase_price_xof' as any)}
            />
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          {tc('cancel')}
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? tc('creating') : t('createButton')}
        </Button>
      </div>

      {createMutation.isError && (
        <p className="text-sm text-red-500">
          {tc('error')}: {createMutation.error.message}
        </p>
      )}
    </form>
  );
}
