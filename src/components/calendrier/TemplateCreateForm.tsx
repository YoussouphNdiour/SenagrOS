'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import {
  cropTypeLabels,
  defaultStagesByCrop,
  calculateTotalDays,
} from '@/lib/validators/calendar.validator';
import type { Stage } from '@/lib/validators/calendar.validator';
import { Plus, Trash2 } from 'lucide-react';

const cropOptions = Object.entries(cropTypeLabels).map(([value, label]) => ({
  value,
  label,
}));

export function TemplateCreateForm() {
  const router = useRouter();
  const t = useTranslations('calendrier');
  const tc = useTranslations('common');

  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('');
  const [variety, setVariety] = useState('');
  const [notes, setNotes] = useState('');
  const [stages, setStages] = useState<Stage[]>([
    { name: '', order: 1, durationDays: 0, actions: [] },
  ]);

  const totalDays = useMemo(() => calculateTotalDays(stages), [stages]);

  const mutation = trpc.calendar.createTemplate.useMutation({
    onSuccess: () => {
      router.push('/calendrier/templates');
    },
  });

  const handleCropTypeChange = (value: string) => {
    setCropType(value);
    // Pre-fill stages if defaults exist
    const defaults = defaultStagesByCrop[value];
    if (defaults) {
      setStages([...defaults]);
      // Auto-generate name
      const label = cropTypeLabels[value] ?? value;
      const total = calculateTotalDays(defaults);
      setName(`${label}${variety ? ` ${variety}` : ''} — cycle ${total}j`);
    }
  };

  const updateStage = (index: number, field: keyof Stage, value: string | number | string[]) => {
    setStages((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  };

  const addStage = () => {
    setStages((prev) => [
      ...prev,
      { name: '', order: prev.length + 1, durationDays: 0, actions: [] },
    ]);
  };

  const removeStage = (index: number) => {
    setStages((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, order: i + 1 })),
    );
  };

  const handleSubmit = () => {
    const validStages = stages.filter((s) => s.name.trim() !== '');
    if (!name || !cropType || validStages.length === 0) return;

    mutation.mutate({
      name,
      cropType,
      variety: variety || undefined,
      stages: validStages,
      totalDays,
      notes: notes || undefined,
    });
  };

  return (
    <Card>
      <h2 className="mb-6 text-lg font-semibold text-gray-800">
        {t('formNewTemplate')}
      </h2>

      {/* Header fields */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label={t('fieldTemplateName')}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Haricot vert Euforia — cycle 84j"
        />
        <Select
          label={t('fieldCropType')}
          options={cropOptions}
          value={cropType}
          onChange={(e) => handleCropTypeChange(e.target.value)}
          placeholder={t('selectCrop')}
        />
        <Input
          label={t('fieldVariety')}
          type="text"
          value={variety}
          onChange={(e) => setVariety(e.target.value)}
          placeholder="Ex: Euforia"
        />
        <div className="flex items-end">
          <div className="rounded-lg bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
            {t('fieldTotalDuration')} : {totalDays} {t('templateDays')}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label htmlFor="template-notes" className="mb-1 block text-sm font-medium text-gray-700">{tc('notes')}</label>
        <textarea
          id="template-notes"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('notesOptional')}
        />
      </div>

      {/* Stages table */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">{t('cycleStages')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-2 py-2 font-medium text-gray-600 w-10">{t('stageColHash')}</th>
                <th className="px-2 py-2 font-medium text-gray-600">{t('stageColName')}</th>
                <th className="px-2 py-2 font-medium text-gray-600 w-28">{t('stageColDuration')}</th>
                <th className="px-2 py-2 font-medium text-gray-600">{t('stageColActions')}</th>
                <th className="px-2 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {stages.map((stage, index) => (
                <tr key={stage.order} className="border-b border-gray-100">
                  <td className="px-2 py-2 text-gray-500">{index + 1}</td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={stage.name}
                      onChange={(e) => updateStage(index, 'name', e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-200"
                      placeholder={t('stageNamePlaceholder')}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min={0}
                      value={stage.durationDays}
                      onChange={(e) =>
                        updateStage(index, 'durationDays', Number.parseInt(e.target.value, 10) || 0)
                      }
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-200"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={stage.actions.join(', ')}
                      onChange={(e) =>
                        updateStage(
                          index,
                          'actions',
                          e.target.value
                            .split(',')
                            .map((a) => a.trim())
                            .filter(Boolean),
                        )
                      }
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-200"
                      placeholder="action1, action2"
                    />
                  </td>
                  <td className="px-2 py-2">
                    {stages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStage(index)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addStage}
          className="mt-3 flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 transition"
        >
          <Plus className="h-4 w-4" />
          {t('addStage')}
        </button>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/calendrier/templates')}>
          {tc('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={mutation.isPending || !name || !cropType || stages.filter((s) => s.name).length === 0}
        >
          {mutation.isPending ? tc('saving') : t('saveTemplate')}
        </Button>
      </div>
    </Card>
  );
}
