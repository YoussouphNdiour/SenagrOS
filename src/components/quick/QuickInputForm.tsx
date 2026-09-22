'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';

type InputType = 'phyto' | 'ferti' | 'semence';

export function QuickInputForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const farmId = (session?.user as { farmId?: string } | undefined)?.farmId ?? '';
  const [parcelId, setParcelId] = useState('');
  const [inputType, setInputType] = useState<InputType>('phyto');
  const [productName, setProductName] = useState('');
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState('L/ha');
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
    if (!parcelId || !productName) return;
    createLog.mutate({
      type: 'input',
      name: `Application ${productName}`,
      timestamp: new Date().toISOString(),
      data: {
        input_type: inputType,
        products: [
          {
            product_name: productName,
            dose_per_ha: parseFloat(dose) || 1,
            dose_unit: unit,
          },
        ],
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
        <h1 className="text-xl font-bold text-gray-800">Intrant rapide</h1>
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
          <label className="mb-1 block text-sm font-medium text-gray-700">Catégorie</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            value={inputType}
            onChange={(e) => setInputType(e.target.value as InputType)}
          >
            <option value="phyto">Phytosanitaire</option>
            <option value="ferti">Fertilisation</option>
            <option value="semence">Semence</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Produit *</label>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Nom du produit"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Dose</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Unité</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              <option>L/ha</option>
              <option>kg/ha</option>
              <option>g/ha</option>
              <option>mL/ha</option>
            </select>
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
          disabled={createLog.isPending || !parcelId || !productName}
          className="w-full"
        >
          {createLog.isPending ? 'Enregistrement...' : "Enregistrer l'application"}
        </Button>
      </form>
    </div>
  );
}
