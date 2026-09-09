'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { calculateExpectedDates } from '@/lib/validators/calendar.validator';
import type { Stage } from '@/lib/validators/calendar.validator';

export function AssignCalendarForm() {
  const router = useRouter();
  const t = useTranslations('calendrier');
  const tc = useTranslations('common');

  const [assetId, setAssetId] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [sowingDate, setSowingDate] = useState('');
  const [notes, setNotes] = useState('');

  const { data: parcels } = trpc.calendar.listParcels.useQuery();
  const { data: templatesData } = trpc.calendar.listTemplates.useQuery({
    page: 1,
    limit: 100,
  });

  const templates = templatesData?.items ?? [];

  const parcelOptions = (parcels ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const templateOptions = templates.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.cropType}${t.variety ? ` — ${t.variety}` : ''})`,
  }));

  const selectedTemplate = templates.find((t) => t.id === calendarId);

  const previewDates = useMemo(() => {
    if (!selectedTemplate || !sowingDate) return [];
    const stages = selectedTemplate.stages as Stage[];
    return calculateExpectedDates(sowingDate, stages);
  }, [selectedTemplate, sowingDate]);

  const mutation = trpc.calendar.assignToParcel.useMutation({
    onSuccess: () => {
      router.push('/calendrier');
    },
  });

  const handleSubmit = () => {
    if (!assetId || !calendarId || !sowingDate) return;
    mutation.mutate({
      assetId,
      calendarId,
      sowingDate,
      notes: notes || undefined,
    });
  };

  return (
    <Card>
      <h2 className="mb-6 text-lg font-semibold text-gray-800">
        {t('formAssign')}
      </h2>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label={t('fieldParcel')}
          options={parcelOptions}
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          placeholder={t('selectParcel')}
        />
        <Select
          label={t('fieldModelTemplate')}
          options={templateOptions}
          value={calendarId}
          onChange={(e) => setCalendarId(e.target.value)}
          placeholder={t('selectTemplate')}
        />
        <Input
          label={t('fieldSowingDate')}
          type="date"
          value={sowingDate}
          onChange={(e) => setSowingDate(e.target.value)}
        />
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label htmlFor="assign-notes" className="mb-1 block text-sm font-medium text-gray-700">{tc('notes')}</label>
        <textarea
          id="assign-notes"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('notesOptional')}
        />
      </div>

      {/* Preview calculated dates */}
      {previewDates.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            {t('previewDates')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="px-3 py-2 font-medium text-gray-600">{t('colStage')}</th>
                  <th className="px-3 py-2 font-medium text-gray-600">{t('colExpectedDate')}</th>
                  <th className="px-3 py-2 font-medium text-gray-600">{t('colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {previewDates.map((stage) => (
                  <tr key={stage.stageName} className="border-b border-gray-100">
                    <td className="px-3 py-2 font-medium">{stage.stageName}</td>
                    <td className="px-3 py-2">
                      {new Date(stage.expectedDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="default">{t('statusUpcoming')}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/calendrier')}>
          {tc('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={mutation.isPending || !assetId || !calendarId || !sowingDate}
        >
          {mutation.isPending ? tc('assigning') : t('assignButton')}
        </Button>
      </div>
    </Card>
  );
}
