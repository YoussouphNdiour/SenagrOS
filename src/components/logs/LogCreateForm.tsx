'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { createLogSchema } from '@/lib/validators/log.validator';
import type { logTypeValues } from '@/lib/validators/log.validator';
import {
  phytoSubcategoryValues,
  phytoSubcategoryLabels,
  fertiSubcategoryValues,
  fertiSubcategoryLabels,
  semenceSubcategoryValues,
  semenceSubcategoryLabels,
} from '@/lib/validators/input.validator';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ComboboxAsync, ComboboxAsyncMulti } from '@/components/ui/ComboboxAsync';
import type { z } from 'zod';

type CreateLogInput = z.input<typeof createLogSchema>;

type LogType = (typeof logTypeValues)[number];

const typeOptions = [
  { value: 'activity', label: 'Activité' },
  { value: 'observation', label: 'Observation' },
  { value: 'input', label: 'Application intrant' },
  { value: 'harvest', label: 'Récolte' },
  { value: 'seeding', label: 'Semis' },
  { value: 'transplanting', label: 'Repiquage' },
  { value: 'birth', label: 'Naissance' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'medical', label: 'Soin médical' },
  { value: 'lab_test', label: 'Analyse labo' },
  { value: 'movement', label: 'Mouvement de stock' },
  { value: 'irrigation', label: 'Irrigation' },
];

const statusOptions = [
  { value: 'pending', label: 'En attente' },
  { value: 'done', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
];

const measureOptions = [
  { value: 'count', label: 'Comptage' },
  { value: 'weight', label: 'Poids' },
  { value: 'volume', label: 'Volume' },
  { value: 'length', label: 'Longueur' },
  { value: 'area', label: 'Surface' },
  { value: 'rate', label: 'Taux' },
];

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
  const { data: session } = useSession();
  const farmId = (session?.user as { farmId?: string } | undefined)?.farmId ?? '';
  const [equipmentIds, setEquipmentIds] = useState<string[]>([]);
  const [workerIds, setWorkerIds] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [targetParcelIds, setTargetParcelIds] = useState<string[]>([]);
  // Seeding: parcel + plant asset links
  const [seedingParcelId, setSeedingParcelId] = useState<string>('');
  const [seedingPlantId, setSeedingPlantId] = useState<string>('');

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

  const { fields: productFields, append: appendProduct, remove: removeProduct } = useFieldArray({
    control,
    name: 'data.products' as any,
  });

  const selectedType = watch('type');
  const sowingType = watch('data.sowing_type' as any);
  const inputType = (watch('data.input_type' as any) as string | undefined) ?? 'phyto';

  const treatedSurfaceHa = watch('data.treated_surface_ha' as any) as number | undefined;
  const sprayVolumePerHa = watch('data.spray_volume_per_ha' as any) as number | undefined;
  const weatherWindSpeed = watch('data.weather.wind_speed_kmh' as any) as number | undefined;
  const weatherHumidity = watch('data.weather.humidity_percent' as any) as number | undefined;
  const weatherRainForecast = watch('data.weather.rain_forecast_24h' as any) as boolean | undefined;

  const inputSubcatOptions =
    inputType === 'ferti'
      ? fertiSubcategoryValues.map((v) => ({ value: v, label: fertiSubcategoryLabels[v] }))
      : inputType === 'semence'
        ? semenceSubcategoryValues.map((v) => ({ value: v, label: semenceSubcategoryLabels[v] }))
        : phytoSubcategoryValues.map((v) => ({ value: v, label: phytoSubcategoryLabels[v] }));

  // Search functions for ComboboxAsync
  const searchEquipment = async (query: string): Promise<AssetItem[]> => {
    if (!farmId) return [];
    const res = await fetch(`/api/trpc/asset.list?input=${encodeURIComponent(JSON.stringify({ json: { farmId, type: 'equipment', search: query || undefined, page: 1, limit: 20 } }))}`);
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
    if (!farmId) return [];
    const res = await fetch(`/api/trpc/asset.list?input=${encodeURIComponent(JSON.stringify({ json: { farmId, type: 'seed', search: query || undefined, page: 1, limit: 20 } }))}`);
    const json = await res.json();
    return json?.result?.data?.json?.items ?? [];
  };

  const searchLand = async (query: string): Promise<AssetItem[]> => {
    if (!farmId) return [];
    const res = await fetch(`/api/trpc/asset.list?input=${encodeURIComponent(JSON.stringify({ json: { farmId, type: 'land', search: query || undefined, page: 1, limit: 20 } }))}`);
    const json = await res.json();
    return json?.result?.data?.json?.items ?? [];
  };

  const searchWorkers = async (query: string): Promise<UserItem[]> => {
    const res = await fetch(`/api/trpc/farmMember.list?input=${encodeURIComponent(JSON.stringify({ json: { search: query || undefined } }))}`);
    const json = await res.json();
    return (json?.result?.data?.json?.items ?? []).map((m: { id: string; name: string | null }) => ({
      id: m.id,
      name: m.name ?? 'Sans nom',
    }));
  };

  const searchPlant = async (query: string): Promise<AssetItem[]> => {
    if (!farmId) return [];
    const res = await fetch(`/api/trpc/asset.list?input=${encodeURIComponent(JSON.stringify({ json: { farmId, type: 'plant', search: query || undefined, page: 1, limit: 20 } }))}`);
    const json = await res.json();
    return json?.result?.data?.json?.items ?? [];
  };

  const searchMaterial = async (query: string): Promise<AssetItem[]> => {
    if (!farmId) return [];
    const res = await fetch(`/api/trpc/asset.list?input=${encodeURIComponent(JSON.stringify({ json: { farmId, type: 'material', search: query || undefined, page: 1, limit: 20 } }))}`);
    const json = await res.json();
    return json?.result?.data?.json?.items ?? [];
  };

  // Auto-calculate spray_volume_total = spray_volume_per_ha * treated_surface_ha
  useEffect(() => {
    if (selectedType !== 'input') return;
    if (sprayVolumePerHa && treatedSurfaceHa && sprayVolumePerHa > 0 && treatedSurfaceHa > 0) {
      const total = Math.round(sprayVolumePerHa * treatedSurfaceHa * 100) / 100;
      const currentTotal = watch('data.spray_volume_total' as any);
      if (currentTotal !== total) {
        control._formValues.data = { ...control._formValues.data, spray_volume_total: total };
      }
    }
  }, [sprayVolumePerHa, treatedSurfaceHa, selectedType]);

  const onSubmit = (values: CreateLogInput) => {
    const enrichedData = selectedType === 'input'
      ? { ...values.data, target_parcel_ids: targetParcelIds }
      : values.data;

    type AssetRole = 'subject' | 'location' | 'input' | 'crop';
    const assetIds: { assetId: string; role: AssetRole }[] = [];
    if (selectedType === 'seeding') {
      if (seedingParcelId) assetIds.push({ assetId: seedingParcelId, role: 'location' });
      if (seedingPlantId) assetIds.push({ assetId: seedingPlantId, role: 'crop' });
    } else if (selectedType === 'input') {
      for (const pid of targetParcelIds) assetIds.push({ assetId: pid, role: 'location' });
    }

    createMutation.mutate({
      ...values,
      data: enrichedData,
      equipmentIds,
      workerIds,
      assigneeId,
      ...(assetIds.length > 0 ? { assetIds } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* General info */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Informations générales</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Type de log"
            options={typeOptions}
            error={errors.type?.message}
            {...register('type')}
          />
          <Input
            label="Nom"
            placeholder="Ex: Semis parcelle Nord"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Date et heure"
            type="datetime-local"
            error={errors.timestamp?.message}
            {...register('timestamp')}
          />
          <Select
            label="Statut"
            options={statusOptions}
            error={errors.status?.message}
            {...register('status')}
          />
        </div>
        <div className="mt-4">
          <Input
            label="Notes"
            placeholder="Remarques ou description..."
            error={errors.notes?.message}
            {...register('notes')}
          />
        </div>
      </Card>

      {/* Seeding enrichi */}
      {selectedType === 'seeding' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Détails du semis</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Type de semis */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Type de semis</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    value="manual"
                    {...register('data.sowing_type' as any)}
                    className="text-green-600 focus:ring-green-500"
                  />
                  Manuel
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    value="machine"
                    {...register('data.sowing_type' as any)}
                    className="text-green-600 focus:ring-green-500"
                  />
                  Machine
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
                    label="Machine (semoir/planteuse)"
                    placeholder="Rechercher une machine..."
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
                  label="Semence utilisée"
                  placeholder="Rechercher une semence..."
                  value={field.value as string}
                  onChange={field.onChange}
                  searchFn={searchSeed}
                  getLabel={(item) => `${item.name} — ${(item.data as any)?.variety ?? ''}`}
                  getValue={(item) => item.id}
                />
              )}
            />

            {/* Target parcel — linked via logAssets (role=location) */}
            <ComboboxAsync<AssetItem>
              label="Parcelle cible"
              placeholder="Rechercher une parcelle..."
              value={seedingParcelId}
              onChange={(val) => setSeedingParcelId(val ?? '')}
              searchFn={searchLand}
              getLabel={(item) => `${item.name}${(item.data as Record<string, unknown>)?.code_parcelle ? ` — ${(item.data as Record<string, unknown>).code_parcelle}` : ''}`}
              getValue={(item) => item.id}
            />

            {/* Plant asset (culture) — linked via logAssets (role=crop) */}
            <ComboboxAsync<AssetItem>
              label="Culture (asset plant)"
              placeholder="Rechercher une culture..."
              value={seedingPlantId}
              onChange={(val) => setSeedingPlantId(val ?? '')}
              searchFn={searchPlant}
              getLabel={(item) => item.name}
              getValue={(item) => item.id}
            />

            <Input
              label="Profondeur de semis (cm)"
              type="number"
              step="0.1"
              min="0"
              placeholder="Ex: 3"
              {...register('data.seed_depth_cm' as any, { valueAsNumber: true })}
            />
            <Input
              label="Écartement entre lignes (cm)"
              type="number"
              step="0.1"
              min="0"
              placeholder="Ex: 75"
              {...register('data.row_spacing_cm' as any, { valueAsNumber: true })}
            />
            <Input
              label="Écartement entre plants (cm)"
              type="number"
              step="0.1"
              min="0"
              placeholder="Ex: 25"
              {...register('data.plant_spacing_cm' as any, { valueAsNumber: true })}
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label="Densité de semis"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ex: 120"
                  {...register('data.seed_rate_kg_ha' as any, { valueAsNumber: true })}
                />
              </div>
              <div className="w-36">
                <Select
                  label="Unité"
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
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Détails activité</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Durée (heures)"
              type="number"
              step="0.5"
              min="0"
              {...register('data.duration_hours' as any, { valueAsNumber: true })}
            />
            <Input
              label="Description"
              placeholder="Description de l'activité"
              {...register('data.description' as any)}
            />
          </div>
        </Card>
      )}

      {/* Harvest fields */}
      {selectedType === 'harvest' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Détails récolte</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Rendement (kg)"
              type="number"
              step="0.1"
              {...register('data.yield_kg' as any, { valueAsNumber: true })}
            />
            <Input
              label="Rendement par ha (kg/ha)"
              type="number"
              step="0.1"
              {...register('data.yield_per_ha' as any, { valueAsNumber: true })}
            />
            <Select
              label="Qualité"
              options={[
                { value: 'A', label: 'Grade A' },
                { value: 'B', label: 'Grade B' },
                { value: 'C', label: 'Grade C' },
              ]}
              {...register('data.quality_grade' as any)}
            />
            <Input
              label="Destination"
              placeholder="Ex: marché local"
              {...register('data.destination' as any)}
            />
            <Input
              label="Prix par kg (FCFA)"
              type="number"
              {...register('data.price_per_kg_xof' as any, { valueAsNumber: true })}
            />
          </div>
        </Card>
      )}

      {/* Input (intrant) fields */}
      {selectedType === 'input' && (
        <>
          {/* Card 1: Détails application intrant */}
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Détails application intrant</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Type d'intrant"
                options={[
                  { value: 'phyto', label: 'Phytosanitaire' },
                  { value: 'ferti', label: 'Fertilisant' },
                  { value: 'semence', label: 'Semence' },
                ]}
                {...register('data.input_type' as any)}
              />
              <Select
                label="Sous-catégorie"
                options={inputSubcatOptions}
                {...register('data.input_subcategory' as any)}
              />
              <div className="sm:col-span-2">
                <ComboboxAsyncMulti<AssetItem>
                  label="Parcelles à traiter"
                  placeholder="Rechercher une parcelle..."
                  value={targetParcelIds}
                  onChange={setTargetParcelIds}
                  searchFn={searchLand}
                  getLabel={(item) => `${item.name} — ${(item.data as any)?.code_parcelle ?? ''}`}
                  getValue={(item) => item.id}
                />
              </div>
              <Input
                label="Surface traitée (ha)"
                type="number"
                step="0.01"
                min="0"
                {...register('data.treated_surface_ha' as any, { valueAsNumber: true })}
              />
              <Input
                label="Méthode"
                placeholder="Ex: pulvérisation"
                {...register('data.method' as any)}
              />
              <Select
                label="Partie ciblée"
                options={[
                  { value: '', label: '— Sélectionner —' },
                  { value: 'sol', label: 'Sol' },
                  { value: 'feuillage', label: 'Feuillage' },
                  { value: 'racines', label: 'Racines' },
                  { value: 'fruits', label: 'Fruits' },
                  { value: 'tiges', label: 'Tiges' },
                  { value: 'semences', label: 'Semences' },
                  { value: 'plante_entiere', label: 'Plante entière' },
                ]}
                {...register('data.target_part' as any)}
              />
              {/* Rétro-compatibilité single product */}
              <Input
                label="Dose"
                type="number"
                step="0.01"
                {...register('data.dose' as any, { valueAsNumber: true })}
              />
              <Input
                label="Unité dose"
                placeholder="Ex: L/ha"
                {...register('data.dose_unit' as any)}
              />
              <Input
                label="Délai de carence (jours)"
                type="number"
                min="0"
                placeholder="Ex: 21"
                {...register('data.withdrawal_days' as any, { valueAsNumber: true })}
              />
              <Input
                label="Nom commercial du produit"
                placeholder="Ex: Roundup, Bayfolan..."
                {...register('data.product_name' as any)}
              />
            </div>
          </Card>

          {/* Card 2: Produits utilisés (mélange de cuve) */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Produits utilisés</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendProduct({
                    product_name: '',
                    subcategory: '',
                    dose_per_ha: 0,
                    dose_unit: 'L/ha',
                    quantity_total: undefined,
                    quantity_unit: '',
                  })
                }
              >
                <Plus className="h-4 w-4" />
                Ajouter un produit
              </Button>
            </div>

            {productFields.length === 0 && (
              <p className="text-sm text-gray-400">Aucun produit ajouté. Utilisez le bouton ci-dessus pour ajouter des produits au mélange.</p>
            )}

            {productFields.map((field, index) => (
              <div key={field.id} className="mb-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Produit {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name={`data.products.${index}.product_id` as any}
                    render={({ field: f }) => (
                      <ComboboxAsync<AssetItem>
                        label="Produit (intrant)"
                        placeholder="Rechercher un intrant..."
                        value={f.value as string}
                        onChange={(val) => {
                          f.onChange(val);
                        }}
                        searchFn={searchMaterial}
                        getLabel={(item) => item.name}
                        getValue={(item) => item.id}
                      />
                    )}
                  />
                  <Input
                    label="Nom du produit"
                    placeholder="Ex: Glyphosate 360"
                    {...register(`data.products.${index}.product_name` as any)}
                  />
                  <Select
                    label="Sous-catégorie"
                    options={[
                      { value: '', label: '— Sélectionner —' },
                      { value: 'herbicide', label: 'Herbicide' },
                      { value: 'insecticide', label: 'Insecticide' },
                      { value: 'fongicide', label: 'Fongicide' },
                      { value: 'acaricide', label: 'Acaricide' },
                      { value: 'nematicide', label: 'Nematicide' },
                      { value: 'regulateur_croissance', label: 'Régulateur de croissance' },
                      { value: 'adjuvant', label: 'Adjuvant' },
                      { value: 'engrais_mineral', label: 'Engrais minéral' },
                      { value: 'engrais_organique', label: 'Engrais organique' },
                      { value: 'biostimulant', label: 'Biostimulant' },
                    ]}
                    {...register(`data.products.${index}.subcategory` as any)}
                  />
                  <Input
                    label="Dose par ha"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 2.5"
                    {...register(`data.products.${index}.dose_per_ha` as any, { valueAsNumber: true })}
                  />
                  <Select
                    label="Unité dose"
                    options={[
                      { value: 'L/ha', label: 'L/ha' },
                      { value: 'kg/ha', label: 'kg/ha' },
                      { value: 'g/ha', label: 'g/ha' },
                      { value: 'mL/ha', label: 'mL/ha' },
                    ]}
                    {...register(`data.products.${index}.dose_unit` as any)}
                  />
                  <Input
                    label="Quantité totale"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Calculé auto si surface renseignée"
                    {...register(`data.products.${index}.quantity_total` as any, { valueAsNumber: true })}
                  />
                </div>
              </div>
            ))}
          </Card>

          {/* Card 3: Volume de bouillie — seulement si phyto */}
          {inputType === 'phyto' && (
            <Card>
              <h3 className="mb-4 text-lg font-semibold text-gray-800">Volume de bouillie</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Volume d'eau (litres)"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ex: 200"
                  {...register('data.water_volume_liters' as any, { valueAsNumber: true })}
                />
                <Input
                  label="Volume bouillie par ha (L/ha)"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ex: 150"
                  {...register('data.spray_volume_per_ha' as any, { valueAsNumber: true })}
                />
                <Input
                  label="Volume bouillie total (L)"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Calculé automatiquement"
                  {...register('data.spray_volume_total' as any, { valueAsNumber: true })}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Le volume total est calculé automatiquement si le volume/ha et la surface sont renseignés.</p>
            </Card>
          )}

          {/* Card 4: Conditions météo */}
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Conditions météo</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Température (°C)"
                type="number"
                step="0.1"
                placeholder="Ex: 28"
                {...register('data.weather.temperature_c' as any, { valueAsNumber: true })}
              />
              <div>
                <Input
                  label="Vitesse du vent (km/h)"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ex: 12"
                  {...register('data.weather.wind_speed_kmh' as any, { valueAsNumber: true })}
                />
                {typeof weatherWindSpeed === 'number' && weatherWindSpeed > 19 && (
                  <p className="text-sm text-orange-600 mt-1">Traitement déconseillé au-delà de 19 km/h</p>
                )}
              </div>
              <Select
                label="Direction du vent"
                options={[
                  { value: '', label: '— Sélectionner —' },
                  { value: 'N', label: 'N' },
                  { value: 'NE', label: 'NE' },
                  { value: 'E', label: 'E' },
                  { value: 'SE', label: 'SE' },
                  { value: 'S', label: 'S' },
                  { value: 'SO', label: 'SO' },
                  { value: 'O', label: 'O' },
                  { value: 'NO', label: 'NO' },
                ]}
                {...register('data.weather.wind_direction' as any)}
              />
              <div>
                <Input
                  label="Humidité (%)"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  placeholder="Ex: 65"
                  {...register('data.weather.humidity_percent' as any, { valueAsNumber: true })}
                />
                {typeof weatherHumidity === 'number' && weatherHumidity > 0 && weatherHumidity < 40 && (
                  <p className="text-sm text-orange-600 mt-1">Risque d'évaporation élevé</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="rain_last_24h"
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  {...register('data.weather.rain_last_24h' as any)}
                />
                <label htmlFor="rain_last_24h" className="text-sm text-gray-700">Pluie dans les dernières 24h</label>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="rain_forecast_24h"
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    {...register('data.weather.rain_forecast_24h' as any)}
                  />
                  <label htmlFor="rain_forecast_24h" className="text-sm text-gray-700">Pluie prévue dans les 24h</label>
                </div>
                {weatherRainForecast && (
                  <p className="text-sm text-orange-600 mt-1">Risque de lessivage du traitement</p>
                )}
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Maintenance fields */}
      {selectedType === 'maintenance' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Détails maintenance</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Type de maintenance"
              placeholder="Ex: vidange, réparation"
              {...register('data.maintenance_type' as any)}
            />
            <Input
              label="Coût (FCFA)"
              type="number"
              {...register('data.cost_xof' as any, { valueAsNumber: true })}
            />
          </div>
        </Card>
      )}

      {/* Medical fields */}
      {selectedType === 'medical' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Détails soin médical</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Traitement"
              placeholder="Ex: vermifuge"
              {...register('data.treatment' as any)}
            />
            <Input
              label="Vétérinaire"
              placeholder="Nom du vétérinaire"
              {...register('data.veterinarian' as any)}
            />
          </div>
        </Card>
      )}

      {/* Birth fields */}
      {selectedType === 'birth' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Détails naissance</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Sexe"
              options={[
                { value: '', label: 'Non spécifié' },
                { value: 'male', label: 'Mâle' },
                { value: 'female', label: 'Femelle' },
              ]}
              {...register('data.sex' as any)}
            />
            <Input
              label="Poids (kg)"
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
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Détails repiquage</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Pépinière source"
              placeholder="Ex: pépinière A"
              {...register('data.source_nursery' as any)}
            />
            <Input
              label="Âge des plants (jours)"
              type="number"
              {...register('data.plant_age_days' as any, { valueAsNumber: true })}
            />
          </div>
        </Card>
      )}

      {/* Irrigation fields */}
      {selectedType === 'irrigation' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Détails irrigation</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Méthode"
              placeholder="Sélectionner une méthode"
              options={[
                { value: 'goutte_a_goutte', label: 'Goutte à goutte' },
                { value: 'aspersion', label: 'Aspersion' },
                { value: 'micro_aspersion', label: 'Micro-aspersion' },
                { value: 'pivot', label: 'Pivot' },
                { value: 'gravitaire', label: 'Gravitaire' },
                { value: 'submersion', label: 'Submersion' },
                { value: 'californien', label: 'Californien' },
                { value: 'manuel', label: 'Manuel' },
              ]}
              {...register('data.method' as any)}
            />
            <Input
              label="Durée (minutes)"
              type="number"
              {...register('data.duration_min' as any, { valueAsNumber: true })}
            />
            <Input
              label="Volume (litres)"
              type="number"
              {...register('data.volume_liters' as any, { valueAsNumber: true })}
            />
          </div>
        </Card>
      )}

      {/* Movement fields */}
      {selectedType === 'movement' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Détails mouvement</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Emplacement source"
              placeholder="Ex: magasin principal"
              {...register('data.from_location' as any)}
            />
            <Input
              label="Emplacement destination"
              placeholder="Ex: champ Nord"
              {...register('data.to_location' as any)}
            />
            <Input
              label="Quantité"
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
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Détails analyse labo</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Type d'échantillon"
              placeholder="Ex: sol, feuille, eau"
              {...register('data.sample_type' as any)}
            />
          </div>
        </Card>
      )}

      {/* Equipment & Worker assignment — for ALL log types */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Assignation matériel & personnel</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <ComboboxAsync<UserItem>
            label="Responsable"
            placeholder="Choisir un responsable..."
            value={assigneeId ?? undefined}
            onChange={(val) => setAssigneeId(val || null)}
            searchFn={searchWorkers}
            getLabel={(item) => item.name}
            getValue={(item) => item.id}
          />
          <ComboboxAsyncMulti<AssetItem>
            label="Équipements utilisés"
            placeholder="Rechercher un équipement..."
            value={equipmentIds}
            onChange={setEquipmentIds}
            searchFn={searchEquipment}
            getLabel={(item) => item.name}
            getValue={(item) => item.id}
          />
          <ComboboxAsyncMulti<UserItem>
            label="Employés assignés"
            placeholder="Rechercher un employé..."
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
          <h3 className="text-lg font-semibold text-gray-800">Mesures / Quantités</h3>
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
            Ajouter
          </Button>
        </div>

        {quantityFields.length === 0 && (
          <p className="text-sm text-gray-400">Aucune mesure ajoutée</p>
        )}

        {quantityFields.map((field, index) => (
          <div key={field.id} className="mb-3 grid grid-cols-12 items-end gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="col-span-3">
              <Select
                label={index === 0 ? 'Mesure' : undefined}
                options={measureOptions}
                {...register(`quantities.${index}.measure`)}
              />
            </div>
            <div className="col-span-2">
              <Input
                label={index === 0 ? 'Valeur' : undefined}
                type="number"
                {...register(`quantities.${index}.numerator`, { valueAsNumber: true })}
              />
            </div>
            <div className="col-span-2">
              <Input
                label={index === 0 ? 'Unité' : undefined}
                placeholder="kg, L, m..."
                {...register(`quantities.${index}.unit`)}
              />
            </div>
            <div className="col-span-4">
              <Input
                label={index === 0 ? 'Label' : undefined}
                placeholder="Ex: poids récolté"
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
          Annuler
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Création...' : 'Créer le log'}
        </Button>
      </div>

      {createMutation.isError && (
        <p className="text-sm text-red-500">Erreur: {createMutation.error.message}</p>
      )}
    </form>
  );
}
