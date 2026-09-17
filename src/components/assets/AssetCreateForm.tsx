'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '@/lib/trpc';
import { createAssetSchema } from '@/lib/validators/asset.validator';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { z } from 'zod';

type CreateAssetInput = z.infer<typeof createAssetSchema>;

const irrigationTypeOptions = [
  { value: 'goutte_a_goutte', label: 'Goutte à goutte' },
  { value: 'aspersion', label: 'Aspersion' },
  { value: 'micro_aspersion', label: 'Micro-aspersion' },
  { value: 'pivot', label: 'Pivot' },
  { value: 'gravitaire', label: 'Gravitaire' },
  { value: 'submersion', label: 'Submersion' },
  { value: 'californien', label: 'Californien' },
  { value: 'manuel', label: 'Manuel' },
  { value: 'pluvial', label: 'Pluvial (non irrigué)' },
];

const soilTypeOptions = [
  { value: 'argileux', label: 'Argileux' },
  { value: 'sableux', label: 'Sableux' },
  { value: 'limoneux', label: 'Limoneux' },
  { value: 'argilo_sableux', label: 'Argilo-sableux' },
  { value: 'limono_argileux', label: 'Limono-argileux' },
  { value: 'limono_sableux', label: 'Limono-sableux' },
  { value: 'lateritique', label: 'Latéritique' },
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

const typeOptions = [
  { value: 'land', label: 'Parcelle' },
  { value: 'plant', label: 'Culture' },
  { value: 'animal', label: 'Animal' },
  { value: 'equipment', label: 'Equipement' },
  { value: 'structure', label: 'Structure' },
  { value: 'sensor', label: 'Capteur' },
  { value: 'water', label: "Point d'eau" },
  { value: 'seed', label: 'Semence' },
  { value: 'product', label: 'Produit' },
  { value: 'compost', label: 'Compost' },
  { value: 'group', label: 'Groupe' },
];

/** Dropdown to select a parent parcel when creating a plant asset */
function ParcelSelect({ register }: { register: ReturnType<typeof useForm<CreateAssetInput>>['register'] }) {
  const { data: parcels, isLoading } = trpc.asset.listLandParcels.useQuery();

  const options = [
    { value: '', label: 'Aucune parcelle' },
    ...(parcels ?? []).map((p) => ({ value: p.id, label: p.name })),
  ];

  if (isLoading) {
    return (
      <Select
        label="Parcelle"
        options={[{ value: '', label: 'Chargement...' }]}
        disabled
      />
    );
  }

  return (
    <Select
      label="Parcelle"
      placeholder="Selectionner une parcelle"
      options={options}
      {...register('parentId')}
    />
  );
}

interface AssetCreateFormProps {
  farmId: string;
}

export function AssetCreateForm({ farmId }: AssetCreateFormProps) {
  const router = useRouter();
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
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Informations generales</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Type d'asset"
            options={typeOptions}
            error={errors.type?.message}
            {...register('type')}
          />
          <Input
            label="Nom"
            placeholder="Ex: Parcelle Nord A"
            error={errors.name?.message}
            {...register('name')}
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
      {selectedType === 'land' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Donnees parcelle</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Surface (ha)"
              type="number"
              step="0.01"
              placeholder="Ex: 2.30"
              {...register('data.surface_ha' as any)}
            />
            <Select
              label="Type de sol"
              placeholder="Sélectionner un type de sol"
              options={soilTypeOptions}
              {...register('data.soil_type' as any)}
            />
            <Select
              label="Type d'irrigation"
              placeholder="Sélectionner un type d'irrigation"
              options={irrigationTypeOptions}
              {...register('data.irrigation_type' as any)}
            />
            <Input
              label="Code parcelle"
              placeholder="Ex: 2P5D2-5374"
              {...register('data.code_parcelle' as any)}
            />
            <Input
              label="Ilot"
              placeholder="Ex: DIAMA"
              {...register('data.ilot' as any)}
            />
          </div>

          {/* Réseau d'irrigation */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h4 className="mb-4 text-md font-semibold text-gray-700">Reseau d&apos;irrigation</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Source d'eau"
                placeholder="Selectionner une source"
                options={irrigationSourceOptions}
                {...register('data.irrigation_network.source' as any)}
              />
              <Select
                label="Type de reseau"
                placeholder="Selectionner un type"
                options={networkTypeOptions}
                {...register('data.irrigation_network.network_type' as any)}
              />
              <Input
                label="Diametre tuyau (mm)"
                type="number"
                placeholder="Ex: 16"
                {...register('data.irrigation_network.pipe_diameter_mm' as any)}
              />
              <Input
                label="Espacement goutteurs (cm)"
                type="number"
                placeholder="Ex: 30"
                {...register('data.irrigation_network.dripper_spacing_cm' as any)}
              />
              <Input
                label="Debit (m³/h)"
                type="number"
                step="0.1"
                placeholder="Ex: 12.5"
                {...register('data.irrigation_network.flow_rate_m3_h' as any)}
              />
              <Input
                label="Type de pompe"
                placeholder="Ex: centrifuge, immergee"
                {...register('data.irrigation_network.pump_type' as any)}
              />
              <Input
                label="Puissance pompe (CV)"
                type="number"
                placeholder="Ex: 10"
                {...register('data.irrigation_network.pump_power_cv' as any)}
              />
              <Select
                label="Filtration"
                placeholder="Selectionner un type"
                options={filtrationOptions}
                {...register('data.irrigation_network.filtration' as any)}
              />
              <Select
                label="Etat du reseau"
                placeholder="Selectionner un etat"
                options={networkConditionOptions}
                {...register('data.irrigation_network.network_condition' as any)}
              />
              <Input
                label="Date d'installation"
                type="date"
                {...register('data.irrigation_network.installation_date' as any)}
              />
              <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
                <input
                  type="checkbox"
                  {...register('data.irrigation_network.fertigation_equipped' as any)}
                  className="rounded"
                />
                Fertigation equipee
              </label>
            </div>
          </div>
        </Card>
      )}

      {selectedType === 'plant' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Donnees culture</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <ParcelSelect register={register} />
            <Input
              label="Type de culture"
              placeholder="Ex: haricot_vert"
              {...register('data.crop_type' as any)}
            />
            <Input
              label="Variete"
              placeholder="Ex: Euforia"
              {...register('data.variety' as any)}
            />
            <Input
              label="Date de plantation"
              type="date"
              {...register('data.planting_date' as any)}
            />
            <Input
              label="Date de recolte prevue"
              type="date"
              {...register('data.expected_harvest_date' as any)}
            />
            <Input
              label="Ecart entre rangs (cm)"
              type="number"
              {...register('data.row_spacing_cm' as any)}
            />
            <Input
              label="Ecart entre plants (cm)"
              type="number"
              {...register('data.plant_spacing_cm' as any)}
            />
            <Input
              label="Densite (plants/ha)"
              type="number"
              {...register('data.density_plants_ha' as any)}
            />
          </div>
        </Card>
      )}

      {selectedType === 'animal' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Fiche animal</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="ID individuel (boucle/tatouage)"
              placeholder="Ex: SN-B-0042"
              {...register('data.individual_id' as any)}
            />
            <Input
              label="Espece"
              placeholder="Ex: Bovin, Ovin, Caprin"
              {...register('data.species' as any)}
            />
            <Input
              label="Race"
              placeholder="Ex: Gobra, Ndama"
              {...register('data.breed' as any)}
            />
            <Input
              label="Robe / Couleur"
              placeholder="Ex: Blanche, Tachetee"
              {...register('data.color' as any)}
            />
            <Select
              label="Sexe"
              options={[
                { value: '', label: 'Selectionner' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Femelle' },
              ]}
              {...register('data.sex' as any)}
            />
            <Input
              label="Date de naissance"
              type="date"
              {...register('data.birth_date' as any)}
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
              {...register('data.livestock_type' as any)}
            />
            <Input
              label="Poids actuel (kg)"
              type="number"
              step="0.1"
              placeholder="Ex: 125.5"
              {...register('data.current_weight_kg' as any)}
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
              {...register('data.health_status' as any)}
            />
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <h4 className="mb-4 text-md font-semibold text-gray-700">Vaccination</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Derniere vaccination — date"
                type="date"
                {...register('data.last_vaccination.date' as any)}
              />
              <Input
                label="Derniere vaccination — type"
                placeholder="Ex: PPCB, Pasteurellose"
                {...register('data.last_vaccination.type' as any)}
              />
              <Input
                label="Prochaine vaccination — date"
                type="date"
                {...register('data.next_vaccination.date' as any)}
              />
              <Input
                label="Prochaine vaccination — type"
                placeholder="Ex: Charbon"
                {...register('data.next_vaccination.type' as any)}
              />
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <Input
              label="Particularites"
              placeholder="Notes specifiques sur cet animal..."
              {...register('data.particularities' as any)}
            />
          </div>
        </Card>
      )}

      {selectedType === 'equipment' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Donnees equipement</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Type d'equipement"
              placeholder="Ex: semoir"
              {...register('data.equipment_type' as any)}
            />
            <Input
              label="Marque"
              placeholder="Ex: John Deere"
              {...register('data.brand' as any)}
            />
            <Input
              label="Modele"
              placeholder="Ex: 1750"
              {...register('data.model' as any)}
            />
            <Input
              label="Numero de serie"
              {...register('data.serial_number' as any)}
            />
            <Input
              label="Date d'achat"
              type="date"
              {...register('data.purchase_date' as any)}
            />
            <Input
              label="Prix d'achat (FCFA)"
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
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Creation...' : "Creer l'asset"}
        </Button>
      </div>

      {createMutation.isError && (
        <p className="text-sm text-red-500">
          Erreur: {createMutation.error.message}
        </p>
      )}
    </form>
  );
}
