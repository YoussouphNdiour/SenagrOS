'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '@/lib/trpc';
import { updateAssetSchema } from '@/lib/validators/asset.validator';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { z } from 'zod';

type UpdateAssetInput = z.infer<typeof updateAssetSchema>;

const irrigationTypeOptions = [
  { value: 'goutte_a_goutte', label: 'Goutte a goutte' },
  { value: 'aspersion', label: 'Aspersion' },
  { value: 'micro_aspersion', label: 'Micro-aspersion' },
  { value: 'pivot', label: 'Pivot' },
  { value: 'gravitaire', label: 'Gravitaire' },
  { value: 'submersion', label: 'Submersion' },
  { value: 'californien', label: 'Californien' },
  { value: 'manuel', label: 'Manuel' },
  { value: 'pluvial', label: 'Pluvial (non irrigue)' },
];

const soilTypeOptions = [
  { value: 'argileux', label: 'Argileux' },
  { value: 'sableux', label: 'Sableux' },
  { value: 'limoneux', label: 'Limoneux' },
  { value: 'argilo_sableux', label: 'Argilo-sableux' },
  { value: 'limono_argileux', label: 'Limono-argileux' },
  { value: 'limono_sableux', label: 'Limono-sableux' },
  { value: 'lateritique', label: 'Lateritique' },
  { value: 'tourbeux', label: 'Tourbeux' },
];

const irrigationSourceOptions = [
  { value: 'forage', label: 'Forage' },
  { value: 'fleuve', label: 'Fleuve' },
  { value: 'lac', label: 'Lac / Mare' },
  { value: 'bassin', label: 'Bassin de retention' },
  { value: 'pluie', label: 'Pluie' },
  { value: 'autre', label: 'Autre' },
];

const networkTypeOptions = [
  { value: 'goutte_a_goutte', label: 'Goutte a goutte' },
  { value: 'aspersion', label: 'Aspersion' },
  { value: 'micro_aspersion', label: 'Micro-aspersion' },
  { value: 'pivot', label: 'Pivot' },
  { value: 'californien', label: 'Californien' },
  { value: 'gravitaire', label: 'Gravitaire' },
  { value: 'submersion', label: 'Submersion' },
];

const filtrationOptions = [
  { value: 'disque', label: 'Disque' },
  { value: 'sable', label: 'Sable' },
  { value: 'tamis', label: 'Tamis' },
  { value: 'aucun', label: 'Aucun' },
];

const networkConditionOptions = [
  { value: 'bon', label: 'Bon' },
  { value: 'moyen', label: 'Moyen' },
  { value: 'degrade', label: 'Degrade' },
  { value: 'hors_service', label: 'Hors service' },
];

const statusOptions = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
  { value: 'archived', label: 'Archive' },
];

interface AssetEditFormProps {
  assetId: string;
  farmId: string;
}

export function AssetEditForm({ assetId, farmId }: AssetEditFormProps) {
  const router = useRouter();
  const { data: asset, isLoading } = trpc.asset.getById.useQuery({ id: assetId });

  const updateMutation = trpc.asset.update.useMutation({
    onSuccess: () => {
      router.push(`/assets/${assetId}`);
    },
  });

  const assetData = asset?.data as Record<string, unknown> | null;
  const irrigationNetwork = (assetData?.irrigation_network as Record<string, unknown>) ?? {};

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateAssetInput>({
    resolver: zodResolver(updateAssetSchema),
    values: asset
      ? {
          id: asset.id,
          name: asset.name,
          status: (asset.status as 'active' | 'inactive' | 'archived') ?? undefined,
          notes: asset.notes ?? undefined,
          isLocation: asset.isLocation ?? false,
          isFixed: asset.isFixed ?? false,
          data: (asset.data as Record<string, unknown>) ?? {},
        }
      : undefined,
  });

  // We need farmId to be available but it's not used in the form directly
  void farmId;

  const onSubmit = (values: UpdateAssetInput) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Asset introuvable
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Informations generales</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nom"
            placeholder="Ex: Parcelle Nord A"
            error={errors.name?.message}
            {...register('name')}
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
            placeholder="Description ou remarques..."
            error={errors.notes?.message}
            {...register('notes')}
          />
        </div>

        <div className="mt-4 flex gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" {...register('isLocation')} className="rounded" />
            Emplacement
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" {...register('isFixed')} className="rounded" />
            Fixe
          </label>
        </div>
      </Card>

      {/* Type-specific data fields */}
      {asset.type === 'land' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Donnees parcelle</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Surface (ha)"
              type="number"
              step="0.01"
              placeholder="Ex: 2.30"
              defaultValue={assetData?.surface_ha as string | undefined}
              {...register('data.surface_ha' as keyof UpdateAssetInput)}
            />
            <Select
              label="Type de sol"
              placeholder="Selectionner un type de sol"
              options={soilTypeOptions}
              defaultValue={assetData?.soil_type as string | undefined}
              {...register('data.soil_type' as keyof UpdateAssetInput)}
            />
            <Select
              label="Type d'irrigation"
              placeholder="Selectionner un type d'irrigation"
              options={irrigationTypeOptions}
              defaultValue={assetData?.irrigation_type as string | undefined}
              {...register('data.irrigation_type' as keyof UpdateAssetInput)}
            />
            <Input
              label="Code parcelle"
              placeholder="Ex: 2P5D2-5374"
              defaultValue={assetData?.code_parcelle as string | undefined}
              {...register('data.code_parcelle' as keyof UpdateAssetInput)}
            />
            <Input
              label="Ilot"
              placeholder="Ex: DIAMA"
              defaultValue={assetData?.ilot as string | undefined}
              {...register('data.ilot' as keyof UpdateAssetInput)}
            />
          </div>

          {/* Reseau d'irrigation */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h4 className="mb-4 text-md font-semibold text-gray-700">Reseau d&apos;irrigation</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Source d'eau"
                placeholder="Selectionner une source"
                options={irrigationSourceOptions}
                defaultValue={irrigationNetwork.source as string | undefined}
                {...register('data.irrigation_network.source' as keyof UpdateAssetInput)}
              />
              <Select
                label="Type de reseau"
                placeholder="Selectionner un type"
                options={networkTypeOptions}
                defaultValue={irrigationNetwork.network_type as string | undefined}
                {...register('data.irrigation_network.network_type' as keyof UpdateAssetInput)}
              />
              <Input
                label="Diametre tuyau (mm)"
                type="number"
                placeholder="Ex: 16"
                defaultValue={irrigationNetwork.pipe_diameter_mm as string | undefined}
                {...register('data.irrigation_network.pipe_diameter_mm' as keyof UpdateAssetInput)}
              />
              <Input
                label="Espacement goutteurs (cm)"
                type="number"
                placeholder="Ex: 30"
                defaultValue={irrigationNetwork.dripper_spacing_cm as string | undefined}
                {...register('data.irrigation_network.dripper_spacing_cm' as keyof UpdateAssetInput)}
              />
              <Input
                label="Debit (m3/h)"
                type="number"
                step="0.1"
                placeholder="Ex: 12.5"
                defaultValue={irrigationNetwork.flow_rate_m3_h as string | undefined}
                {...register('data.irrigation_network.flow_rate_m3_h' as keyof UpdateAssetInput)}
              />
              <Input
                label="Type de pompe"
                placeholder="Ex: centrifuge, immergee"
                defaultValue={irrigationNetwork.pump_type as string | undefined}
                {...register('data.irrigation_network.pump_type' as keyof UpdateAssetInput)}
              />
              <Input
                label="Puissance pompe (CV)"
                type="number"
                placeholder="Ex: 10"
                defaultValue={irrigationNetwork.pump_power_cv as string | undefined}
                {...register('data.irrigation_network.pump_power_cv' as keyof UpdateAssetInput)}
              />
              <Select
                label="Filtration"
                placeholder="Selectionner un type"
                options={filtrationOptions}
                defaultValue={irrigationNetwork.filtration as string | undefined}
                {...register('data.irrigation_network.filtration' as keyof UpdateAssetInput)}
              />
              <Select
                label="Etat du reseau"
                placeholder="Selectionner un etat"
                options={networkConditionOptions}
                defaultValue={irrigationNetwork.network_condition as string | undefined}
                {...register('data.irrigation_network.network_condition' as keyof UpdateAssetInput)}
              />
              <Input
                label="Date d'installation"
                type="date"
                defaultValue={irrigationNetwork.installation_date as string | undefined}
                {...register('data.irrigation_network.installation_date' as keyof UpdateAssetInput)}
              />
              <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
                <input
                  type="checkbox"
                  defaultChecked={irrigationNetwork.fertigation_equipped as boolean | undefined}
                  {...register('data.irrigation_network.fertigation_equipped' as keyof UpdateAssetInput)}
                  className="rounded"
                />
                Fertigation equipee
              </label>
            </div>
          </div>
        </Card>
      )}

      {asset.type === 'plant' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Donnees culture</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Type de culture"
              placeholder="Ex: haricot_vert"
              defaultValue={assetData?.crop_type as string | undefined}
              {...register('data.crop_type' as keyof UpdateAssetInput)}
            />
            <Input
              label="Variete"
              placeholder="Ex: Euforia"
              defaultValue={assetData?.variety as string | undefined}
              {...register('data.variety' as keyof UpdateAssetInput)}
            />
            <Input
              label="Date de plantation"
              type="date"
              defaultValue={assetData?.planting_date as string | undefined}
              {...register('data.planting_date' as keyof UpdateAssetInput)}
            />
            <Input
              label="Date de recolte prevue"
              type="date"
              defaultValue={assetData?.expected_harvest_date as string | undefined}
              {...register('data.expected_harvest_date' as keyof UpdateAssetInput)}
            />
            <Input
              label="Ecart entre rangs (cm)"
              type="number"
              defaultValue={assetData?.row_spacing_cm as string | undefined}
              {...register('data.row_spacing_cm' as keyof UpdateAssetInput)}
            />
            <Input
              label="Ecart entre plants (cm)"
              type="number"
              defaultValue={assetData?.plant_spacing_cm as string | undefined}
              {...register('data.plant_spacing_cm' as keyof UpdateAssetInput)}
            />
            <Input
              label="Densite (plants/ha)"
              type="number"
              defaultValue={assetData?.density_plants_ha as string | undefined}
              {...register('data.density_plants_ha' as keyof UpdateAssetInput)}
            />
          </div>
        </Card>
      )}

      {asset.type === 'animal' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Fiche animal</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="ID individuel (boucle/tatouage)"
              placeholder="Ex: SN-B-0042"
              defaultValue={assetData?.individual_id as string | undefined}
              {...register('data.individual_id' as keyof UpdateAssetInput)}
            />
            <Input
              label="Espece"
              placeholder="Ex: Bovin, Ovin, Caprin"
              defaultValue={assetData?.species as string | undefined}
              {...register('data.species' as keyof UpdateAssetInput)}
            />
            <Input
              label="Race"
              placeholder="Ex: Gobra, Ndama"
              defaultValue={assetData?.breed as string | undefined}
              {...register('data.breed' as keyof UpdateAssetInput)}
            />
            <Input
              label="Robe / Couleur"
              placeholder="Ex: Blanche, Tachetee"
              defaultValue={assetData?.color as string | undefined}
              {...register('data.color' as keyof UpdateAssetInput)}
            />
            <Select
              label="Sexe"
              options={[
                { value: '', label: 'Selectionner' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Femelle' },
              ]}
              defaultValue={assetData?.sex as string | undefined}
              {...register('data.sex' as keyof UpdateAssetInput)}
            />
            <Input
              label="Date de naissance"
              type="date"
              defaultValue={assetData?.birth_date as string | undefined}
              {...register('data.birth_date' as keyof UpdateAssetInput)}
            />
            <Select
              label="Type d'elevage"
              options={[
                { value: '', label: 'Selectionner' },
                { value: 'embouche', label: 'Embouche' },
                { value: 'naisseur', label: 'Naisseur' },
                { value: 'laitier', label: 'Laitier' },
                { value: 'mixte', label: 'Mixte' },
              ]}
              defaultValue={assetData?.livestock_type as string | undefined}
              {...register('data.livestock_type' as keyof UpdateAssetInput)}
            />
            <Input
              label="Poids actuel (kg)"
              type="number"
              step="0.1"
              placeholder="Ex: 125.5"
              defaultValue={assetData?.current_weight_kg as string | undefined}
              {...register('data.current_weight_kg' as keyof UpdateAssetInput)}
            />
            <Select
              label="Statut sanitaire"
              options={[
                { value: '', label: 'Selectionner' },
                { value: 'bon', label: 'Bon' },
                { value: 'surveille', label: 'Surveille' },
                { value: 'malade', label: 'Malade' },
                { value: 'traitement', label: 'En traitement' },
              ]}
              defaultValue={assetData?.health_status as string | undefined}
              {...register('data.health_status' as keyof UpdateAssetInput)}
            />
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <h4 className="mb-4 text-md font-semibold text-gray-700">Vaccination</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Derniere vaccination — date"
                type="date"
                defaultValue={(assetData?.last_vaccination as Record<string, unknown> | undefined)?.date as string | undefined}
                {...register('data.last_vaccination.date' as keyof UpdateAssetInput)}
              />
              <Input
                label="Derniere vaccination — type"
                placeholder="Ex: PPCB, Pasteurellose"
                defaultValue={(assetData?.last_vaccination as Record<string, unknown> | undefined)?.type as string | undefined}
                {...register('data.last_vaccination.type' as keyof UpdateAssetInput)}
              />
              <Input
                label="Prochaine vaccination — date"
                type="date"
                defaultValue={(assetData?.next_vaccination as Record<string, unknown> | undefined)?.date as string | undefined}
                {...register('data.next_vaccination.date' as keyof UpdateAssetInput)}
              />
              <Input
                label="Prochaine vaccination — type"
                placeholder="Ex: Charbon"
                defaultValue={(assetData?.next_vaccination as Record<string, unknown> | undefined)?.type as string | undefined}
                {...register('data.next_vaccination.type' as keyof UpdateAssetInput)}
              />
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <Input
              label="Particularites"
              placeholder="Notes specifiques sur cet animal..."
              defaultValue={assetData?.particularities as string | undefined}
              {...register('data.particularities' as keyof UpdateAssetInput)}
            />
          </div>
        </Card>
      )}

      {asset.type === 'equipment' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Donnees equipement</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Type d'equipement"
              placeholder="Ex: semoir"
              defaultValue={assetData?.equipment_type as string | undefined}
              {...register('data.equipment_type' as keyof UpdateAssetInput)}
            />
            <Input
              label="Marque"
              placeholder="Ex: John Deere"
              defaultValue={assetData?.brand as string | undefined}
              {...register('data.brand' as keyof UpdateAssetInput)}
            />
            <Input
              label="Modele"
              placeholder="Ex: 1750"
              defaultValue={assetData?.model as string | undefined}
              {...register('data.model' as keyof UpdateAssetInput)}
            />
            <Input
              label="Numero de serie"
              defaultValue={assetData?.serial_number as string | undefined}
              {...register('data.serial_number' as keyof UpdateAssetInput)}
            />
            <Input
              label="Date d'achat"
              type="date"
              defaultValue={assetData?.purchase_date as string | undefined}
              {...register('data.purchase_date' as keyof UpdateAssetInput)}
            />
            <Input
              label="Prix d'achat (FCFA)"
              type="number"
              defaultValue={assetData?.purchase_price_xof as string | undefined}
              {...register('data.purchase_price_xof' as keyof UpdateAssetInput)}
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
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>

      {updateMutation.isError && (
        <p className="text-sm text-red-500">
          Erreur: {updateMutation.error.message}
        </p>
      )}
    </form>
  );
}
