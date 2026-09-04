'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [matureAtDate, setMatureAtDate] = useState(0);
  const [matureAtForecast, setMatureAtForecast] = useState(0);
  const [immature, setImmature] = useState(0);

  // --- Comments ---
  const [estimatedYield, setEstimatedYield] = useState('');
  const [estimatedHarvestDate, setEstimatedHarvestDate] = useState('');
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

  const maturityTotal = useMemo(
    () => matureAtDate + matureAtForecast + immature,
    [matureAtDate, matureAtForecast, immature],
  );
  const maturityPct = useMemo(
    () => (maturityTotal > 0 ? Math.round((matureAtDate / maturityTotal) * 10000) / 100 : 0),
    [matureAtDate, maturityTotal],
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
          Fiche d&apos;agr&eacute;age qualit&eacute; pr&eacute;-r&eacute;colte
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Parcelle"
            options={parcelOptions}
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            placeholder="Sélectionner une parcelle"
          />
          <Input
            label="Culture"
            type="text"
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
          />
          <Input
            label="Variété"
            type="text"
            value={variety}
            onChange={(e) => setVariety(e.target.value)}
          />
          <Input
            label="Date observation"
            type="date"
            value={observationDate}
            onChange={(e) => setObservationDate(e.target.value)}
          />
          <Input
            label="Taille échantillon"
            type="number"
            min={1}
            value={sampleSize}
            onChange={(e) => setSampleSize(Number(e.target.value))}
          />
          <Input
            label="Heure début"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            label="Heure fin"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
          <Input
            label="Surface observée (ha)"
            type="number"
            step="0.01"
            value={observedSurfaceHa}
            onChange={(e) => setObservedSurfaceHa(e.target.value)}
          />
        </div>
      </Card>

      {/* Longueurs totales */}
      <Card>
        <h3 className="mb-3 text-base font-semibold text-gray-800">Longueurs totales</h3>
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
          Total : <span className="font-bold text-green-700">{totalTotal}</span>
        </p>
      </Card>

      {/* Longueurs valorisables */}
      <Card>
        <h3 className="mb-3 text-base font-semibold text-gray-800">Longueurs valorisables</h3>
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
          Total : <span className="font-bold text-green-700">{marketableTotal}</span>
        </p>
        <p className="mt-1 text-sm">
          % Valorisable :{' '}
          <span className="font-bold text-green-700">{marketablePct.toFixed(2)}%</span>
        </p>
      </Card>

      {/* Défauts majeurs */}
      <Card>
        <h3 className="mb-3 text-base font-semibold text-gray-800">Défauts majeurs</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-left font-medium text-gray-600">Type</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Nombre</th>
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

      {/* Indice de maturité */}
      <Card>
        <h3 className="mb-3 text-base font-semibold text-gray-800">Indice de maturité</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input
            label="Épis matures à date"
            type="number"
            min={0}
            value={matureAtDate || ''}
            onChange={(e) => setMatureAtDate(Number(e.target.value))}
          />
          <Input
            label="Matures à date prévisionnelle"
            type="number"
            min={0}
            value={matureAtForecast || ''}
            onChange={(e) => setMatureAtForecast(Number(e.target.value))}
          />
          <Input
            label="Immatures"
            type="number"
            min={0}
            value={immature || ''}
            onChange={(e) => setImmature(Number(e.target.value))}
          />
        </div>
        <div className="mt-3 space-y-1 text-sm text-gray-600">
          <p>
            Total : <span className="font-bold text-green-700">{maturityTotal}</span>
          </p>
          <p>
            % Maturité :{' '}
            <span className="font-bold text-green-700">{maturityPct.toFixed(2)}%</span>
          </p>
        </div>
      </Card>

      {/* Commentaires */}
      <Card>
        <h3 className="mb-3 text-base font-semibold text-gray-800">Commentaires</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Rendement prévisionnel (épis/ha)"
              type="number"
              min={0}
              value={estimatedYield}
              onChange={(e) => setEstimatedYield(e.target.value)}
            />
            <Input
              label="Date prévisionnelle récolte"
              type="date"
              value={estimatedHarvestDate}
              onChange={(e) => setEstimatedHarvestDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Remarques observateur
            </label>
            <textarea
              value={observerRemarks}
              onChange={(e) => setObserverRemarks(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Remarques chef de ferme
            </label>
            <textarea
              value={supervisorRemarks}
              onChange={(e) => setSupervisorRemarks(e.target.value)}
              rows={3}
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
          {createGrading.isPending ? 'Enregistrement...' : 'Enregistrer la fiche'}
        </Button>
      </div>
    </div>
  );
}
