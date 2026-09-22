'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';

const observationTypes = [
  { value: 'emergence_density', label: 'Densité de levée' },
  { value: 'cultural_stage', label: 'Suivi stade cultural' },
  { value: 'pest_disease', label: 'Maladies / Ravageurs' },
  { value: 'pre_harvest_grading', label: 'Agréage pré-récolte' },
] as const;

type ObsType = (typeof observationTypes)[number]['value'];

export function QuickObservationForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const farmId = (session?.user as { farmId?: string } | undefined)?.farmId ?? '';
  const [parcelId, setParcelId] = useState('');
  const [obsType, setObsType] = useState<ObsType>('emergence_density');
  const [notes, setNotes] = useState('');

  const { data: parcels } = trpc.asset.list.useQuery(
    { farmId, type: 'land', page: 1, limit: 100 },
    { enabled: !!farmId },
  );

  const createLog = trpc.log.create.useMutation({
    onSuccess: () => router.push('/observations'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parcelId) return;
    createLog.mutate({
      type: 'observation',
      name: `Observation — ${observationTypes.find((t) => t.value === obsType)?.label ?? obsType}`,
      timestamp: new Date().toISOString(),
      data: { observation_type: obsType },
      notes: notes || undefined,
      assetIds: [{ assetId: parcelId, role: 'subject' }],
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Observation rapide</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Parcelle *</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            value={parcelId}
            onChange={(e) => setParcelId(e.target.value)}
            required
          >
            <option value="">Sélectionner une parcelle</option>
            {parcels?.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {"Type d'observation"}
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            value={obsType}
            onChange={(e) => setObsType(e.target.value as ObsType)}
          >
            {observationTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observations..."
          />
        </div>
        <Button
          type="submit"
          disabled={createLog.isPending || !parcelId}
          className="w-full"
        >
          {createLog.isPending ? 'Enregistrement...' : "Enregistrer l'observation"}
        </Button>
      </form>
    </div>
  );
}
