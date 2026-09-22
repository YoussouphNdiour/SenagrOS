'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';

export function QuickBirthForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const farmId = (session?.user as { farmId?: string } | undefined)?.farmId ?? '';
  const [animalId, setAnimalId] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('female');
  const [weightKg, setWeightKg] = useState('');
  const [notes, setNotes] = useState('');

  const { data: animals } = trpc.asset.list.useQuery(
    { farmId, type: 'animal', page: 1, limit: 100 },
    { enabled: !!farmId },
  );

  const createLog = trpc.log.create.useMutation({
    onSuccess: () => router.push('/logs'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!animalId) return;
    createLog.mutate({
      type: 'birth',
      name: `Naissance — ${animals?.items.find((a) => a.id === animalId)?.name ?? 'Animal'}`,
      timestamp: new Date().toISOString(),
      data: {
        mother_id: animalId,
        sex,
        weight_kg: weightKg ? parseFloat(weightKg) : undefined,
      },
      notes: notes || undefined,
      assetIds: [{ assetId: animalId, role: 'subject' }],
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
        <h1 className="text-xl font-bold text-gray-800">Naissance rapide</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Animal mère *</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            value={animalId}
            onChange={(e) => setAnimalId(e.target.value)}
            required
          >
            <option value="">Sélectionner un animal</option>
            {animals?.items.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Sexe du nouveau-né</label>
          <div className="flex gap-3">
            {(['male', 'female'] as const).map((s) => (
              <label key={s} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="sex"
                  value={s}
                  checked={sex === s}
                  onChange={() => setSex(s)}
                  className="text-green-600"
                />
                <span className="text-sm text-gray-700">{s === 'male' ? 'Mâle' : 'Femelle'}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Poids à la naissance (kg)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="Ex : 4.5"
          />
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
          disabled={createLog.isPending || !animalId}
          className="w-full"
        >
          {createLog.isPending ? 'Enregistrement...' : 'Déclarer la naissance'}
        </Button>
      </form>
    </div>
  );
}
