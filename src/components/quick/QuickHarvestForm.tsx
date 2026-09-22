'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';

export function QuickHarvestForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const farmId = (session?.user as { farmId?: string } | undefined)?.farmId ?? '';
  const [parcelId, setParcelId] = useState('');
  const [yieldKg, setYieldKg] = useState('');
  const [qualityGrade, setQualityGrade] = useState('A');
  const [notes, setNotes] = useState('');

  const { data: parcels } = trpc.asset.list.useQuery(
    { farmId, type: 'land', page: 1, limit: 100 },
    { enabled: !!farmId },
  );

  const createLog = trpc.log.create.useMutation({
    onSuccess: () => router.push('/logs'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parcelId || !yieldKg) return;
    createLog.mutate({
      type: 'harvest',
      name: `Récolte — ${parcels?.items.find((p) => p.id === parcelId)?.name ?? 'Parcelle'}`,
      timestamp: new Date().toISOString(),
      data: {
        yield_kg: parseFloat(yieldKg),
        quality_grade: qualityGrade,
      },
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
        <h1 className="text-xl font-bold text-gray-800">Récolte rapide</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Parcelle *
          </label>
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
            Quantité récoltée (kg) *
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            value={yieldKg}
            onChange={(e) => setYieldKg(e.target.value)}
            placeholder="Ex : 250"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Grade qualité
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            value={qualityGrade}
            onChange={(e) => setQualityGrade(e.target.value)}
          >
            <option value="A">Grade A — Premium</option>
            <option value="B">Grade B — Standard</option>
            <option value="C">Grade C — Inférieur</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observations optionnelles..."
          />
        </div>

        <Button
          type="submit"
          disabled={createLog.isPending || !parcelId || !yieldKg}
          className="w-full"
        >
          {createLog.isPending ? 'Enregistrement...' : 'Enregistrer la récolte'}
        </Button>
      </form>
    </div>
  );
}
