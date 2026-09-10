'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
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
  const inputType = (watch('data.input_type' as any) as string | undefined) ?? 'phyto';

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

            {/* Target parcel */}
            <Controller
              control={control}
              name={'data.target_parcel_id' as any}
              render={({ field }) => (
                <ComboboxAsync<AssetItem>
                  label="Parcelle cible"
                  placeholder="Rechercher une parcelle..."
                  value={field.value as string}
                  onChange={field.onChange}
                  searchFn={searchLand}
                  getLabel={(item) => `${item.name} — ${(item.data as any)?.code_parcelle ?? ''}`}
                  getValue={(item) => item.id}
                />
              )}
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
              label="Méthode"
              placeholder="Ex: pulvérisation"
              {...register('data.method' as any)}
            />
            <Input
              label="Surface traitée (ha)"
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
            <Input
              label="Méthode"
              placeholder="Ex: goutte à goutte"
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
