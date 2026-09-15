'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '@/lib/trpc';
import { createAssetSchema } from '@/lib/validators/asset.validator';
import {
  phytoSubcategoryValues,
  fertiSubcategoryValues,
  semenceSubcategoryValues,
  phytoSubcategoryLabels,
  fertiSubcategoryLabels,
  semenceSubcategoryLabels,
  inputCategoryLabels,
  formLabels,
} from '@/lib/validators/input.validator';
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

const inputCategoryOptions = [
  { value: 'phyto', label: inputCategoryLabels.phyto },
  { value: 'ferti', label: inputCategoryLabels.ferti },
  { value: 'semence', label: inputCategoryLabels.semence },
];

const toxicityClassOptions = [
  { value: 'I', label: 'Classe I' },
  { value: 'II', label: 'Classe II' },
  { value: 'III', label: 'Classe III' },
  { value: 'IV', label: 'Classe IV' },
  { value: 'U', label: 'Classe U' },
];

const formOptions = [
  { value: 'liquide', label: formLabels.liquide },
  { value: 'granule', label: formLabels.granule },
  { value: 'poudre', label: formLabels.poudre },
  { value: 'suspension', label: formLabels.suspension },
];

function getSubcategoryOptions(category: string) {
  switch (category) {
    case 'phyto':
      return phytoSubcategoryValues.map((v) => ({ value: v, label: phytoSubcategoryLabels[v] }));
    case 'ferti':
      return fertiSubcategoryValues.map((v) => ({ value: v, label: fertiSubcategoryLabels[v] }));
    case 'semence':
      return semenceSubcategoryValues.map((v) => ({ value: v, label: semenceSubcategoryLabels[v] }));
    default:
      return [];
  }
}

const typeOptions = [
  { value: 'land', label: 'Parcelle' },
  { value: 'plant', label: 'Culture' },
  { value: 'animal', label: 'Animal' },
  { value: 'equipment', label: 'Equipement' },
  { value: 'structure', label: 'Structure' },
  { value: 'material', label: 'Intrant' },
  { value: 'sensor', label: 'Capteur' },
  { value: 'water', label: "Point d'eau" },
  { value: 'seed', label: 'Semence' },
  { value: 'product', label: 'Produit' },
  { value: 'compost', label: 'Compost' },
  { value: 'group', label: 'Groupe' },
];

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
  const selectedCategory = watch('data.input_category' as any) as string | undefined;

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

      {selectedType === 'material' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Donnees intrant</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Categorie d'intrant"
              placeholder="Selectionner une categorie"
              options={inputCategoryOptions}
              {...register('data.input_category' as any)}
            />
            <Select
              label="Sous-categorie"
              placeholder="Selectionner une sous-categorie"
              options={selectedCategory ? getSubcategoryOptions(selectedCategory) : []}
              {...register('data.input_subcategory' as any)}
            />
            <Input
              label="Nom commercial"
              placeholder="Ex: Roundup, NPK 15-15-15"
              {...register('data.commercial_name' as any)}
            />
            <Input
              label="Matiere active"
              placeholder="Ex: Glyphosate (pour phyto)"
              {...register('data.active_ingredient' as any)}
            />
            <Input
              label="Composition NPK"
              placeholder="Ex: 15-15-15 (pour ferti)"
              {...register('data.composition_npk' as any)}
            />
            <Input
              label="Dose recommandee"
              placeholder="Ex: 2 L/ha"
              {...register('data.recommended_dose' as any)}
            />
            <Input
              label="DAR - Delai Avant Recolte (jours)"
              type="number"
              placeholder="Ex: 14"
              {...register('data.dar_days' as any)}
            />
            <Input
              label="DDR - Delai De Reentree (jours)"
              type="number"
              placeholder="Ex: 2"
              {...register('data.ddr_days' as any)}
            />
            <Select
              label="Classe de toxicite"
              placeholder="Selectionner une classe"
              options={toxicityClassOptions}
              {...register('data.toxicity_class' as any)}
            />
            <Select
              label="Forme"
              placeholder="Selectionner une forme"
              options={formOptions}
              {...register('data.form' as any)}
            />
            <Input
              label="Dose minimale"
              type="number"
              step="0.01"
              placeholder="Ex: 1.5"
              {...register('data.dose_min' as any)}
            />
            <Input
              label="Dose maximale"
              type="number"
              step="0.01"
              placeholder="Ex: 3.0"
              {...register('data.dose_max' as any)}
            />
            <Input
              label="Unite de dose"
              placeholder="Ex: L/ha, kg/ha, g/ha"
              {...register('data.dose_unit' as any)}
            />
            <Input
              label="Nb max applications par cycle"
              type="number"
              placeholder="Ex: 3"
              {...register('data.max_applications_per_cycle' as any)}
            />
            <Input
              label="Organismes cibles"
              placeholder="Ex: pucerons, mildiou, rouille (separes par virgules)"
              {...register('data.target_organisms' as any)}
            />
            <Input
              label="Cultures homologuees"
              placeholder="Ex: tomate, oignon, riz (separes par virgules)"
              {...register('data.target_crops' as any)}
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
