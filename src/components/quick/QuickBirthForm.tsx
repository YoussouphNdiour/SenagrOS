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

export function QuickBirthForm() {
  const router = useRouter();
  const t = useTranslations('quick');

  const [animalParentId, setAnimalParentId] = useState('');
  const [sexe, setSexe] = useState('male');
  const [poidsKg, setPoidsKg] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.log.create.useMutation({
    onSuccess: () => {
      router.push('/logs');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const searchAnimal = useCallback(async (query: string): Promise<AssetItem[]> => {
    const res = await fetch(
      `/api/trpc/asset.list?input=${encodeURIComponent(JSON.stringify({ json: { type: 'animal', search: query || undefined, page: 1, limit: 20 } }))}`,
    );
    const json = await res.json();
    return json?.result?.data?.json?.items ?? [];
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate({
      type: 'birth',
      name: t('titleBirth'),
      timestamp: new Date().toISOString(),
      status: 'done',
      data: {
        mother_id: animalParentId || undefined,
        sex: (sexe as 'male' | 'female') || undefined,
        weight_kg: poidsKg ? Number(poidsKg) : undefined,
      },
      assetIds: animalParentId ? [{ assetId: animalParentId, role: 'subject' }] : undefined,
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

      <h1 className="mb-6 text-xl font-semibold text-gray-800">{t('titleBirth')}</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('fieldAnimalParent')}</label>
          <ComboboxAsync<AssetItem>
            searchFn={searchAnimal}
            getLabel={(item) => item.name}
            getValue={(item) => item.id}
            value={animalParentId}
            onChange={(val) => {
              setAnimalParentId(val);
            }}
            placeholder={t('fieldAnimalParent')}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('fieldSexe')}</label>
          <select
            value={sexe}
            onChange={(e) => setSexe(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          >
            <option value="male">{t('sexMale')}</option>
            <option value="female">{t('sexFemale')}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('fieldPoidsKg')}</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={poidsKg}
            onChange={(e) => setPoidsKg(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? t('submitting') : t('submitBirth')}
        </button>
      </form>
    </div>
  );
}
