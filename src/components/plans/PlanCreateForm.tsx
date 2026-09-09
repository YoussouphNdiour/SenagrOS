'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import {
  planTypeLabels,
  seasonLabels,
} from '@/lib/validators/plan.validator';

const typeOptions = Object.entries(planTypeLabels).map(([value, label]) => ({
  value,
  label,
}));

export function PlanCreateForm() {
  const router = useRouter();
  const t = useTranslations('plans');
  const tc = useTranslations('common');

  const seasonOptions = [
    { value: '', label: tc('noResult') },
    ...Object.entries(seasonLabels).map(([value, label]) => ({ value, label })),
  ];

  const [name, setName] = useState('');
  const [type, setType] = useState('crop');
  const [season, setSeason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const mutation = trpc.plan.create.useMutation({
    onSuccess: (data) => {
      router.push(`/plans/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type) return;

    mutation.mutate({
      name: name.trim(),
      type: type as 'crop' | 'grazing' | 'harvest',
      season: season || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">{t('formSectionInfo')}</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label={t('fieldName')}
            placeholder={t('namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Select
            label={t('fieldType')}
            options={typeOptions}
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
          <Select
            label={t('fieldSeason')}
            options={seasonOptions}
            value={season}
            onChange={(e) => setSeason(e.target.value)}
          />
          <div /> {/* spacer */}
          <Input
            label={t('fieldStartDate')}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label={t('fieldEndDate')}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <label htmlFor="plan-notes" className="mb-1 block text-sm font-medium text-gray-700">{tc('notes')}</label>
          <textarea
            id="plan-notes"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            rows={3}
            placeholder={t('notesPlaceholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </Card>

      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tc('cancel')}
        </Button>
        <Button type="submit" disabled={mutation.isPending || !name.trim()}>
          {mutation.isPending ? tc('creating') : t('createButton')}
        </Button>
      </div>

      {mutation.isError && (
        <p className="mt-2 text-sm text-red-500">{tc('error')} : {mutation.error.message}</p>
      )}
    </form>
  );
}
