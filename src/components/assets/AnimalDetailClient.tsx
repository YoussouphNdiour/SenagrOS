'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Archive, Pencil, Scale, Syringe, AlertTriangle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

interface WeightEntry {
  date: string;
  weight_kg: number;
}

interface VaccinationInfo {
  date: string;
  type: string;
}

interface AnimalData {
  individual_id?: string;
  breed?: string;
  color?: string;
  sex?: string;
  birth_date?: string;
  species?: string;
  livestock_type?: string;
  current_weight_kg?: number;
  weight_history?: WeightEntry[];
  last_vaccination?: VaccinationInfo;
  next_vaccination?: VaccinationInfo;
  health_status?: string;
  particularities?: string;
  tag_id?: string;
}

const sexLabels: Record<string, string> = {
  male: 'Male',
  female: 'Femelle',
};

const livestockTypeLabels: Record<string, string> = {
  embouche: 'Embouche',
  naisseur: 'Naisseur',
  laitier: 'Laitier',
  mixte: 'Mixte',
};

const healthStatusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  bon: 'success',
  surveille: 'warning',
  malade: 'danger',
  traitement: 'warning',
};

function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (totalDays < 0) return '—';

  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);

  if (years > 0) {
    return `${years} an${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mois` : ''}`;
  }
  if (months > 0) {
    return `${months} mois`;
  }
  return `${totalDays} jour${totalDays > 1 ? 's' : ''}`;
}

function calculateGMQ(weightHistory: WeightEntry[]): string | null {
  if (!weightHistory || weightHistory.length < 2) return null;

  const sorted = [...weightHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const days =
    (new Date(last.date).getTime() - new Date(first.date).getTime()) /
    (1000 * 60 * 60 * 24);

  if (days <= 0) return null;

  const gmq = ((last.weight_kg - first.weight_kg) / days) * 1000; // in grams
  return `${gmq.toFixed(0)} g/jour`;
}

function isVaccinationAlert(nextVaccination?: VaccinationInfo): 'overdue' | 'soon' | null {
  if (!nextVaccination?.date) return null;
  const nextDate = new Date(nextVaccination.date);
  const now = new Date();
  const diffDays = (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 7) return 'soon';
  return null;
}

interface AnimalDetailClientProps {
  assetId: string;
}

export function AnimalDetailClient({ assetId }: AnimalDetailClientProps) {
  const router = useRouter();
  const [weighModalOpen, setWeighModalOpen] = useState(false);
  const [weighDate, setWeighDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [weighValue, setWeighValue] = useState('');

  const utils = trpc.useUtils();
  const { data: asset, isLoading } = trpc.asset.getById.useQuery({ id: assetId });

  const archiveMutation = trpc.asset.archive.useMutation({
    onSuccess: () => router.push('/assets/animal'),
  });

  const updateMutation = trpc.asset.update.useMutation({
    onSuccess: () => {
      utils.asset.getById.invalidate({ id: assetId });
      setWeighModalOpen(false);
      setWeighValue('');
    },
  });

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
        Animal introuvable
      </div>
    );
  }

  const data = (asset.data ?? {}) as AnimalData;
  const weightHistory = data.weight_history ?? [];
  const gmq = calculateGMQ(weightHistory);
  const vaccinationAlert = isVaccinationAlert(data.next_vaccination);

  const chartData = [...weightHistory]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((entry) => ({
      date: new Date(entry.date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      }),
      poids: entry.weight_kg,
    }));

  const handleWeigh = () => {
    const weight = Number.parseFloat(weighValue);
    if (Number.isNaN(weight) || weight <= 0) return;

    const newEntry: WeightEntry = { date: weighDate, weight_kg: weight };
    const updatedHistory = [...weightHistory, newEntry];
    const updatedData = {
      ...data,
      current_weight_kg: weight,
      weight_history: updatedHistory,
    };

    updateMutation.mutate({
      id: assetId,
      data: updatedData as Record<string, unknown>,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">{asset.name}</h1>
              <Badge variant={asset.status === 'active' ? 'success' : 'warning'}>
                {asset.status ?? '—'}
              </Badge>
              {data.health_status && (
                <Badge variant={healthStatusVariant[data.health_status] ?? 'default'}>
                  {data.health_status}
                </Badge>
              )}
              {vaccinationAlert === 'overdue' && (
                <Badge variant="danger">Vaccination en retard</Badge>
              )}
              {vaccinationAlert === 'soon' && (
                <Badge variant="warning">Vaccination imminente</Badge>
              )}
            </div>
            {data.individual_id && (
              <p className="mt-1 text-sm text-gray-500">
                ID: {data.individual_id}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setWeighModalOpen(true)}>
            <Scale className="h-4 w-4" />
            Peser
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/assets/${asset.id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
            Modifier
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm('Archiver cet animal ?')) {
                archiveMutation.mutate({ id: asset.id });
              }
            }}
            disabled={archiveMutation.isPending}
          >
            <Archive className="h-4 w-4" />
            Archiver
          </Button>
        </div>
      </div>

      {/* Identification + Type d'elevage */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">Identification</h3>
          <dl className="space-y-2 text-sm">
            {(data.individual_id || (Array.isArray(asset.idTags) && (asset.idTags as string[]).length > 0)) && (
              <div className="flex justify-between">
                <dt className="text-gray-500">ID individuel (boucle/tatouage)</dt>
                <dd className="font-medium">
                  {data.individual_id ?? (asset.idTags as string[])[0]}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Nom</dt>
              <dd className="font-medium">{asset.name}</dd>
            </div>
            {asset.parentId && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Troupeau</dt>
                <dd className="font-medium">
                  <button
                    type="button"
                    onClick={() => router.push(`/assets/${asset.parentId}`)}
                    className="text-green-600 hover:underline"
                  >
                    Voir le troupeau
                  </button>
                </dd>
              </div>
            )}
            {data.species && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Espece</dt>
                <dd className="font-medium">{data.species}</dd>
              </div>
            )}
            {data.breed && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Race</dt>
                <dd className="font-medium">{data.breed}</dd>
              </div>
            )}
            {data.color && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Robe / Couleur</dt>
                <dd className="font-medium">{data.color}</dd>
              </div>
            )}
            {data.sex && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Sexe</dt>
                <dd className="font-medium">{sexLabels[data.sex] ?? data.sex}</dd>
              </div>
            )}
            {data.birth_date && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Date de naissance</dt>
                <dd className="font-medium">
                  {new Date(data.birth_date).toLocaleDateString('fr-FR')} ({calculateAge(data.birth_date)})
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">Type d&apos;elevage</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Type</dt>
              <dd className="font-medium">
                {data.livestock_type
                  ? livestockTypeLabels[data.livestock_type] ?? data.livestock_type
                  : '—'}
              </dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <h4 className="mb-3 text-md font-semibold text-gray-700">Particularites</h4>
            <p className="text-sm text-gray-600">
              {data.particularities || 'Aucune particularite renseignee.'}
            </p>
          </div>

          {asset.notes && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <h4 className="mb-2 text-md font-semibold text-gray-700">Notes</h4>
              <p className="text-sm text-gray-600">{asset.notes}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Suivi ponderal */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Suivi ponderal</h3>
          <Button variant="outline" size="sm" onClick={() => setWeighModalOpen(true)}>
            <Scale className="h-4 w-4" />
            Ajouter une pesee
          </Button>
        </div>

        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-green-50 p-3">
            <p className="text-xs text-gray-500">Poids actuel</p>
            <p className="text-xl font-bold text-green-700">
              {data.current_weight_kg ? `${data.current_weight_kg} kg` : '—'}
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-gray-500">Nombre de pesees</p>
            <p className="text-xl font-bold text-blue-700">{weightHistory.length}</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs text-gray-500">GMQ (Gain Moyen Quotidien)</p>
            <p className="text-xl font-bold text-orange-700">{gmq ?? '—'}</p>
          </div>
        </div>

        {chartData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{
                  value: 'kg',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12 },
                }}
              />
              <Tooltip
                formatter={(value) => [`${value} kg`, 'Poids']}
              />
              <Line
                type="monotone"
                dataKey="poids"
                stroke="#2E7D32"
                strokeWidth={2}
                dot={{ fill: '#2E7D32', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">
            Ajoutez au moins 2 pesees pour afficher le graphique d&apos;evolution.
          </p>
        )}
      </Card>

      {/* Sante & Vaccination */}
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Syringe className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">Sante &amp; Vaccination</h3>
        </div>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Statut sanitaire</dt>
            <dd>
              {data.health_status ? (
                <Badge variant={healthStatusVariant[data.health_status] ?? 'default'}>
                  {data.health_status}
                </Badge>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Derniere vaccination</dt>
            <dd className="font-medium">
              {data.last_vaccination
                ? `${new Date(data.last_vaccination.date).toLocaleDateString('fr-FR')} — ${data.last_vaccination.type}`
                : '—'}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Prochaine vaccination</dt>
            <dd className="flex items-center gap-2 font-medium">
              {data.next_vaccination ? (
                <>
                  {new Date(data.next_vaccination.date).toLocaleDateString('fr-FR')} — {data.next_vaccination.type}
                  {vaccinationAlert === 'overdue' && (
                    <span className="flex items-center gap-1 text-xs text-red-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      En retard
                    </span>
                  )}
                  {vaccinationAlert === 'soon' && (
                    <span className="flex items-center gap-1 text-xs text-yellow-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Imminente
                    </span>
                  )}
                </>
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-4 border-t border-gray-200 pt-3">
          <button
            type="button"
            onClick={() => router.push(`/logs?assetId=${assetId}&type=medical`)}
            className="text-sm text-green-600 hover:underline"
          >
            Voir les journaux medicaux lies a cet animal
          </button>
        </div>
      </Card>

      {/* Children (sub-assets) */}
      {asset.children && asset.children.length > 0 && (
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">
            Sous-assets ({asset.children.length})
          </h3>
          <ul className="divide-y divide-gray-100">
            {asset.children.map((child) => (
              <li
                key={child.id}
                className="flex cursor-pointer items-center justify-between py-2 hover:bg-gray-50"
                onClick={() => router.push(`/assets/${child.id}`)}
              >
                <span className="font-medium text-gray-800">{child.name}</span>
                <Badge variant={child.status === 'active' ? 'success' : 'warning'}>
                  {child.status ?? '—'}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Weigh Modal */}
      <Modal
        isOpen={weighModalOpen}
        onClose={() => setWeighModalOpen(false)}
        title="Peser l'animal"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Date de la pesee"
            type="date"
            value={weighDate}
            onChange={(e) => setWeighDate(e.target.value)}
          />
          <Input
            label="Poids (kg)"
            type="number"
            step="0.1"
            min="0"
            placeholder="Ex: 125.5"
            value={weighValue}
            onChange={(e) => setWeighValue(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setWeighModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleWeigh}
              disabled={updateMutation.isPending || !weighValue}
            >
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
          {updateMutation.isError && (
            <p className="text-sm text-red-500">
              Erreur: {updateMutation.error.message}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
