'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import {
  planTypeLabels,
  planStatusLabels,
  seasonLabels,
} from '@/lib/validators/plan.validator';

const typeOptions = Object.entries(planTypeLabels).map(([value, label]) => ({
  value,
  label,
}));

const statusOptions = Object.entries(planStatusLabels).map(([value, label]) => ({
  value,
  label,
}));

interface PlanEditClientProps {
  id: string;
}

export function PlanEditClient({ id }: PlanEditClientProps) {
  const router = useRouter();
  const t = useTranslations('plans');
  const tc = useTranslations('common');

  const seasonOptions = [
    { value: '', label: tc('noResult') },
    ...Object.entries(seasonLabels).map(([value, label]) => ({ value, label })),
  ];

  const { data: plan, isLoading } = trpc.plan.getById.useQuery({ id });

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [season, setSeason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setType(plan.type);
      setStatus(plan.status ?? 'active');
      setSeason(plan.season ?? '');
      setStartDate(plan.startDate ?? '');
      setEndDate(plan.endDate ?? '');
      setNotes(plan.notes ?? '');
    }
  }, [plan]);

  const mutation = trpc.plan.update.useMutation({
    onSuccess: () => {
      router.push(`/plans/${id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    mutation.mutate({
      id,
      name: name.trim(),
      type: type as 'crop' | 'grazing' | 'harvest',
      status: status as 'active' | 'completed' | 'cancelled',
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
            label={tc('status')}
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
          <Select
            label={t('fieldSeason')}
            options={seasonOptions}
            value={season}
            onChange={(e) => setSeason(e.target.value)}
          />
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
          <label htmlFor="plan-notes-edit" className="mb-1 block text-sm font-medium text-gray-700">{tc('notes')}</label>
          <textarea
            id="plan-notes-edit"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            rows={3}
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
          {mutation.isPending ? tc('saving') : t('saveButton')}
        </Button>
      </div>

      {mutation.isError && (
        <p className="mt-2 text-sm text-red-500">{tc('error')} : {mutation.error.message}</p>
      )}
    </form>
  );
}
