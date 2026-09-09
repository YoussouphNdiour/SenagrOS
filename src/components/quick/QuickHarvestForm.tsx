'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { ComboboxAsync } from '@/components/ui/ComboboxAsync';

interface AssetItem {
  id: string;
  name: string;
  type: string;
}

export function QuickHarvestForm() {
  const router = useRouter();
  const t = useTranslations('quick');

  const [parcelleId, setParcelleId] = useState('');
  const [parcelleName, setParcelleName] = useState('');
  const [quantite, setQuantite] = useState('');
  const [qualite, setQualite] = useState('A');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.log.create.useMutation({
    onSuccess: () => {
      router.push('/logs');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const searchLand = useCallback(async (query: string): Promise<AssetItem[]> => {
    const res = await fetch(
      `/api/trpc/asset.list?input=${encodeURIComponent(JSON.stringify({ json: { type: 'land', search: query || undefined, page: 1, limit: 20 } }))}`,
    );
    const json = await res.json();
    return json?.result?.data?.json?.items ?? [];
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate({
      type: 'harvest',
      name: parcelleName ? `Récolte — ${parcelleName}` : 'Récolte rapide',
      timestamp: new Date().toISOString(),
      status: 'done',
      notes: notes || undefined,
      data: {
        yield_kg: quantite ? Number(quantite) : undefined,
        quality_grade: qualite || undefined,
      },
      assetIds: parcelleId ? [{ assetId: parcelleId, role: 'location' }] : undefined,
    });
  };

  const isPending = createMutation.isPending;

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/quick"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToQuick')}
      </Link>

      <h1 className="mb-6 text-xl font-semibold text-gray-800">{t('titleHarvest')}</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('fieldParcelle')}</label>
          <ComboboxAsync<AssetItem>
            searchFn={searchLand}
            getLabel={(item) => item.name}
            getValue={(item) => item.id}
            value={parcelleId}
            onChange={(val) => {
              setParcelleId(val);
            }}
            placeholder={t('fieldParcelle')}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('fieldQuantiteKg')}</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('fieldQualite')}</label>
          <select
            value={qualite}
            onChange={(e) => setQualite(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          >
            <option value="A">{t('gradeA')}</option>
            <option value="B">{t('gradeB')}</option>
            <option value="C">{t('gradeC')}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('fieldNotes')}</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? t('submitting') : t('submitHarvest')}
        </button>
      </form>
    </div>
  );
}
