'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

// Stage options are domain-specific agronomic terms — kept as-is
const STAGE_OPTIONS = [
  { value: 'semis', label: 'Semis' },
  { value: 'levee_1', label: 'Levée - 1ère decade' },
  { value: 'levee_2', label: 'Levée - 2ème decade' },
  { value: 'levee_3', label: 'Levée - 3ème decade' },
  { value: 'levee_4', label: 'Levée - 4ème decade' },
  { value: 'tallage', label: 'Tallage' },
  { value: 'montaison', label: 'Montaison' },
  { value: 'epiaison', label: 'Épiaison' },
  { value: 'floraison', label: 'Floraison' },
  { value: 'formation_grain', label: 'Formation grain' },
  { value: 'maturite_laiteuse', label: 'Maturité laiteuse' },
  { value: 'maturite_physiologique', label: 'Maturité physiologique' },
  { value: 'senescence', label: 'Sénescence' },
  { value: 'germination', label: 'Germination' },
  { value: 'cotyledons', label: 'Cotylédons' },
  { value: 'feuilles_vraies', label: 'Feuilles vraies' },
  { value: 'ramification', label: 'Ramification' },
  { value: 'bouton_floral', label: 'Bouton floral' },
  { value: 'nouaison', label: 'Nouaison' },
  { value: 'grossissement_fruit', label: 'Grossissement fruit' },
  { value: 'veraison', label: 'Véraison' },
  { value: 'maturite', label: 'Maturité' },
];

export function StageForm() {
  const router = useRouter();
  const t = useTranslations('observations');
  const tc = useTranslations('common');

  const [assetId, setAssetId] = useState('');
  const [cropType, setCropType] = useState('');
  const [variety, setVariety] = useState('');
  const [observationDate, setObservationDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [observedSurfaceHa, setObservedSurfaceHa] = useState('');
  const [stageReached, setStageReached] = useState('');
  const [dateReached, setDateReached] = useState('');
  const [observerRemarks, setObserverRemarks] = useState('');
  const [supervisorRemarks, setSupervisorRemarks] = useState('');

  const { data: parcels } = trpc.observation.listParcels.useQuery();

  const parcelOptions = (parcels ?? []).map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const mutation = trpc.observation.createStage.useMutation({
    onSuccess: () => {
      router.push('/observations');
    },
  });

  const handleSubmit = () => {
    mutation.mutate({
      assetId,
      cropType,
      variety,
      observationDate,
      startTime,
      endTime,
      observedSurfaceHa: observedSurfaceHa ? Number(observedSurfaceHa) : undefined,
      stageReached,
      dateReached,
      observerRemarks,
      supervisorRemarks,
    });
  };

  return (
    <Card>
      <h2 className="mb-6 text-lg font-semibold text-gray-800">
        {t('formStageTitle')}
      </h2>

      {/* Header fields */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label={t('fieldParcel')}
          options={parcelOptions}
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          placeholder={t('selectParcel')}
        />
        <Input
          label={t('fieldCropType')}
          type="text"
          value={cropType}
          onChange={(e) => setCropType(e.target.value)}
        />
        <Input
          label={t('fieldVariety')}
          type="text"
          value={variety}
          onChange={(e) => setVariety(e.target.value)}
        />
        <Input
          label={t('fieldObservationDate')}
          type="date"
          value={observationDate}
          onChange={(e) => setObservationDate(e.target.value)}
        />
        <Input
          label={t('fieldStartTime')}
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
        <Input
          label={t('fieldEndTime')}
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
        <Input
          label={t('fieldObservedSurface')}
          type="number"
          step="0.01"
          value={observedSurfaceHa}
          onChange={(e) => setObservedSurfaceHa(e.target.value)}
        />
      </div>

      {/* Main section — Stade cultural */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label={t('fieldStageReached')}
          options={STAGE_OPTIONS}
          value={stageReached}
          onChange={(e) => setStageReached(e.target.value)}
          placeholder={t('selectStage')}
        />
        <Input
          label={t('fieldDateReached')}
          type="date"
          value={dateReached}
          onChange={(e) => setDateReached(e.target.value)}
        />
      </div>

      {/* Remarks */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('observerRemarks')}
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            rows={4}
            value={observerRemarks}
            onChange={(e) => setObserverRemarks(e.target.value)}
            placeholder={t('observerRemarksPlaceholder')}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('supervisorRemarks')}
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            rows={4}
            value={supervisorRemarks}
            onChange={(e) => setSupervisorRemarks(e.target.value)}
            placeholder={t('supervisorRemarksPlaceholder')}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? tc('registering') : t('registerButton')}
        </Button>
      </div>
    </Card>
  );
}
