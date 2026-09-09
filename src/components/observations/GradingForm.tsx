'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import {
  calculateGradingTotals,
  defectTypeLabels,
} from '@/lib/validators/observation.validator';

type DefectType = 'degats_oiseaux' | 'degats_chenilles' | 'malformations' | 'mauvaise_fecondation';
const DEFECT_TYPES: DefectType[] = ['degats_oiseaux', 'degats_chenilles', 'malformations', 'mauvaise_fecondation'];

interface LengthClass {
  gt19cm: number;
  from19to16cm: number;
  from16to14cm: number;
  lt14cm: number;
}

const EMPTY_LENGTHS: LengthClass = {
  gt19cm: 0,
  from19to16cm: 0,
  from16to14cm: 0,
  lt14cm: 0,
};

export function GradingForm() {
  const router = useRouter();
  const t = useTranslations('observations');
  const tc = useTranslations('common');

  // --- Header fields ---
  const [assetId, setAssetId] = useState('');
  const [cropType, setCropType] = useState('');
  const [variety, setVariety] = useState('');
  const [observationDate, setObservationDate] = useState('');
  const [sampleSize, setSampleSize] = useState(20);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [observedSurfaceHa, setObservedSurfaceHa] = useState('');

  // --- Lengths ---
  const [totalLengths, setTotalLengths] = useState<LengthClass>({ ...EMPTY_LENGTHS });
  const [marketableLengths, setMarketableLengths] = useState<LengthClass>({ ...EMPTY_LENGTHS });

  // --- Major defects ---
  const [majorDefects, setMajorDefects] = useState(
    DEFECT_TYPES.map((type) => ({ type, count: 0 })),
  );

  // --- Maturity index ---
  const matureAtDate = 0;
  const matureAtForecast = 0;
  const immature = 0;

  // --- Comments ---
  const estimatedYield = '';
  const estimatedHarvestDate = '';
  const [observerRemarks, setObserverRemarks] = useState('');
  const [supervisorRemarks, setSupervisorRemarks] = useState('');

  // --- Data fetching ---
  const { data: parcels } = trpc.observation.listParcels.useQuery();
  const createGrading = trpc.observation.createGrading.useMutation({
    onSuccess: () => router.push('/observations'),
  });

  // --- Computed values ---
  const totalTotal = useMemo(() => calculateGradingTotals(totalLengths), [totalLengths]);
  const marketableTotal = useMemo(
    () => calculateGradingTotals(marketableLengths),
    [marketableLengths],
  );
  const marketablePct = useMemo(
    () => (totalTotal > 0 ? Math.round((marketableTotal / totalTotal) * 10000) / 100 : 0),
    [marketableTotal, totalTotal],
  );

  // --- Handlers ---
  function updateTotalLength(key: keyof LengthClass, value: number) {
    setTotalLengths((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  }

  function updateMarketableLength(key: keyof LengthClass, value: number) {
    setMarketableLengths((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  }

  function updateDefectCount(index: number, value: number) {
    setMajorDefects((prev) =>
      prev.map((d, i) => (i === index ? { ...d, count: Math.max(0, value) } : d)),
    );
  }

  function handleSubmit() {
    createGrading.mutate({
      assetId,
      cropType,
      variety: variety || undefined,
      observationDate,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      observedSurfaceHa: Number(observedSurfaceHa) || undefined,
      sampleSize,
      totalLengths,
      marketableLengths,
      majorDefects: majorDefects.map((d) => ({ type: d.type, count: d.count })),
      maturityIndex: { matureAtDate, matureAtForecast, immature },
      estimatedYieldPerHa: Number(estimatedYield) || undefined,
      estimatedHarvestDate: estimatedHarvestDate || undefined,
      observerRemarks: observerRemarks || undefined,
      supervisorRemarks: supervisorRemarks || undefined,
    });
  }

  // --- Build parcel options ---
  const parcelOptions = (parcels ?? []).map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const lengthKeys: { key: keyof LengthClass; label: string }[] = [
    { key: 'gt19cm', label: '> 19 cm' },
    { key: 'from19to16cm', label: '19-16 cm' },
    { key: 'from16to14cm', label: '16-14 cm' },
    { key: 'lt14cm', label: '< 14 cm' },
  ];

  return (
    <div className="space-y-6">
      {/* Header fields */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          {t('formGradingTitle')}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            label={t('labelSample')}
            type="number"
            min={1}
            value={sampleSize}
            onChange={(e) => setSampleSize(Number(e.target.value))}
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
      </Card>

      {/* Longueurs totales */}
      <Card>
        <h3 className="mb-3 text-base font-semibold text-gray-800">{t('labelTotalPods')}</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {lengthKeys.map(({ key, label }) => (
            <Input
              key={key}
              label={label}
              type="number"
              min={0}
              value={totalLengths[key] || ''}
              onChange={(e) => updateTotalLength(key, Number(e.target.value))}
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-600">
          {tc('total')} : <span className="font-bold text-green-700">{totalTotal}</span>
        </p>
      </Card>

      {/* Longueurs valorisables */}
      <Card>
        <h3 className="mb-3 text-base font-semibold text-gray-800">{t('labelMarketable')}</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {lengthKeys.map(({ key, label }) => (
            <Input
              key={key}
              label={label}
              type="number"
              min={0}
              value={marketableLengths[key] || ''}
              onChange={(e) => updateMarketableLength(key, Number(e.target.value))}
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-600">
          {tc('total')} : <span className="font-bold text-green-700">{marketableTotal}</span>
        </p>
        <p className="mt-1 text-sm">
          {t('labelMarketablePct')} :{' '}
          <span className="font-bold text-green-700">{marketablePct.toFixed(2)}%</span>
        </p>
      </Card>

      {/* Défauts majeurs */}
      <Card>
        <h3 className="mb-3 text-base font-semibold text-gray-800">{t('labelDefectPct')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-left font-medium text-gray-600">{tc('type')}</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">{tc('quantity')}</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">%</th>
              </tr>
            </thead>
            <tbody>
              {majorDefects.map((defect, index) => {
                const pct =
                  sampleSize > 0
                    ? Math.round((defect.count / sampleSize) * 10000) / 100
                    : 0;
                return (
                  <tr key={defect.type} className="border-b border-gray-100">
                    <td className="px-3 py-2 font-medium text-gray-700">
                      {defectTypeLabels[defect.type]}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={defect.count || ''}
                        onChange={(e) => updateDefectCount(index, Number(e.target.value))}
                      />
                    </td>
                    <td className="px-3 py-2 font-bold text-green-700">{pct.toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Commentaires */}
      <Card>
        <h3 className="mb-3 text-base font-semibold text-gray-800">{t('sectionRemarks')}</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('observerRemarks')}
            </label>
            <textarea
              value={observerRemarks}
              onChange={(e) => setObserverRemarks(e.target.value)}
              rows={3}
              placeholder={t('observerRemarksPlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('supervisorRemarks')}
            </label>
            <textarea
              value={supervisorRemarks}
              onChange={(e) => setSupervisorRemarks(e.target.value)}
              rows={3}
              placeholder={t('supervisorRemarksPlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
        </div>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={
            !assetId || !cropType || !observationDate || createGrading.isPending
          }
        >
          {createGrading.isPending ? tc('registering') : t('recordButton')}
        </Button>
      </div>
    </div>
  );
}
