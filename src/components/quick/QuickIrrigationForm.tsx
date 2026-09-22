'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';

const irrigationMethods = [
  'goutte-à-goutte',
  'aspersion',
  'gravitaire',
  'pivot',
  'micro-aspersion',
] as const;

export function QuickIrrigationForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const farmId = (session?.user as { farmId?: string } | undefined)?.farmId ?? '';
  const [parcelId, setParcelId] = useState('');
  const [method, setMethod] = useState('goutte-à-goutte');
  const [durationMin, setDurationMin] = useState('');
  const [volumeLiters, setVolumeLiters] = useState('');
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
    if (!parcelId) return;
    createLog.mutate({
      type: 'irrigation',
      name: `Irrigation — ${method}`,
      timestamp: new Date().toISOString(),
      data: {
        method,
        duration_min: durationMin ? parseInt(durationMin, 10) : undefined,
        volume_liters: volumeLiters ? parseFloat(volumeLiters) : undefined,
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
        <h1 className="text-xl font-bold text-gray-800">Irrigation rapide</h1>
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
            <option value="">Sélectionner</option>
            {parcels?.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Méthode</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            {irrigationMethods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Durée (min)</label>
            <input
              type="number"
              min="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              placeholder="60"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Volume (L)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              value={volumeLiters}
              onChange={(e) => setVolumeLiters(e.target.value)}
              placeholder="500"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          disabled={createLog.isPending || !parcelId}
          className="w-full"
        >
          {createLog.isPending ? 'Enregistrement...' : "Enregistrer l'irrigation"}
        </Button>
      </form>
    </div>
  );
}
