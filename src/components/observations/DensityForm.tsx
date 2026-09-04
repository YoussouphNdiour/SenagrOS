'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { calculateDensity } from '@/lib/validators/observation.validator';

function buildRepetitions(count: number): { rep: number; plantCount: number }[] {
  return Array.from({ length: count }, (_, i) => ({ rep: i + 1, plantCount: 0 }));
}

export function DensityForm() {
  const router = useRouter();

  // --- Header fields ---
  const [assetId, setAssetId] = useState('');
  const [cropType, setCropType] = useState('');
  const [variety, setVariety] = useState('');
  const [observationDate, setObservationDate] = useState('');
  const [theoreticalDensity, setTheoreticalDensity] = useState(0);
  const [sampleAreaM2, setSampleAreaM2] = useState(1);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [observedSurfaceHa, setObservedSurfaceHa] = useState('');

  // --- Repetitions ---
  const [numReps, setNumReps] = useState(10);
  const [repetitions, setRepetitions] = useState(buildRepetitions(10));

  // --- Remarks ---
  const [observerRemarks, setObserverRemarks] = useState('');
  const [supervisorRemarks, setSupervisorRemarks] = useState('');

  // --- Data fetching ---
  const { data: parcels } = trpc.observation.listParcels.useQuery();
  const createDensity = trpc.observation.createDensity.useMutation({
    onSuccess: () => router.push('/observations'),
  });

  // --- Computed results ---
  const results = useMemo(
    () =>
      calculateDensity({
        repetitions,
        sampleAreaM2,
        theoreticalDensity,
      }),
    [repetitions, sampleAreaM2, theoreticalDensity],
  );

  // --- Handlers ---
  function handleNumRepsChange(value: number) {
    const clamped = Math.max(1, Math.min(50, value));
    setNumReps(clamped);
    setRepetitions((prev) => {
      if (clamped > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: clamped - prev.length }, (_, i) => ({
            rep: prev.length + i + 1,
            plantCount: 0,
          })),
        ];
      }
      return prev.slice(0, clamped);
    });
  }

  function handlePlantCountChange(index: number, value: number) {
    setRepetitions((prev) =>
      prev.map((r, i) => (i === index ? { ...r, plantCount: Math.max(0, value) } : r)),
    );
  }

  function handleSubmit() {
    createDensity.mutate({
      assetId,
      cropType,
      variety: variety || undefined,
      observationDate,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      observedSurfaceHa: observedSurfaceHa ? Number(observedSurfaceHa) : undefined,
      numRepetitions: numReps,
      theoreticalDensity,
      sampleAreaM2,
      repetitions,
      observerRemarks: observerRemarks || undefined,
      supervisorRemarks: supervisorRemarks || undefined,
    });
  }

  // --- Build parcel options ---
  const parcelOptions = (parcels ?? []).map((item) => ({
    value: item.id,
    label: item.name,
  }));

  // --- Build table rows (paired) ---
  const pairedRows: [number, number | null][] = [];
  for (let i = 0; i < repetitions.length; i += 2) {
    pairedRows.push([i, i + 1 < repetitions.length ? i + 1 : null]);
  }

  return (
    <div className="space-y-6">
      {/* Header fields */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Fiche de comptage — Densité de levée
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
            label="Densité semis théorique (plants/ha)"
            type="number"
            value={theoreticalDensity || ''}
            onChange={(e) => setTheoreticalDensity(Number(e.target.value))}
          />
          <Input
            label="Surface échantillon (m²)"
            type="number"
            step="0.01"
            value={sampleAreaM2}
            onChange={(e) => setSampleAreaM2(Number(e.target.value))}
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

      {/* Repetitions configuration */}
      <Card>
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Nombre de répétitions</label>
          <input
            type="number"
            min={1}
            max={50}
            value={numReps}
            onChange={(e) => handleNumRepsChange(Number(e.target.value))}
            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
        </div>

        {/* Repetitions table — 2-column layout */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-left font-medium text-gray-600">Rép. #</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Nombre de plants
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Rép. #</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Nombre de plants
                </th>
              </tr>
            </thead>
            <tbody>
              {pairedRows.map(([leftIdx, rightIdx]) => (
                <tr key={leftIdx} className="border-b border-gray-100">
                  {/* Left rep */}
                  <td className="px-3 py-2 font-medium text-gray-700">
                    {repetitions[leftIdx].rep}
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      value={repetitions[leftIdx].plantCount || ''}
                      onChange={(e) => handlePlantCountChange(leftIdx, Number(e.target.value))}
                    />
                  </td>
                  {/* Right rep */}
                  {rightIdx !== null ? (
                    <>
                      <td className="px-3 py-2 font-medium text-gray-700">
                        {repetitions[rightIdx].rep}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          value={repetitions[rightIdx].plantCount || ''}
                          onChange={(e) =>
                            handlePlantCountChange(rightIdx, Number(e.target.value))
                          }
                        />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2" />
                    </>
                  )}
                </tr>
              ))}
              {/* Total row */}
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td className="px-3 py-2 font-semibold text-gray-800" colSpan={2}>
                  TOTAL
                </td>
                <td className="px-3 py-2 font-semibold text-green-700" colSpan={2}>
                  {results.totalPlants} plants
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Auto-calculated results */}
      <Card className="border-2 border-green-500">
        <h3 className="mb-3 text-base font-semibold text-gray-800">Résultats calculés</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="text-center">
            <p className="text-sm text-gray-500">Total plants</p>
            <p className="text-3xl font-bold text-green-700">{results.totalPlants}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Densité réelle (plts/ha)</p>
            <p className="text-3xl font-bold text-green-700">
              {results.realDensityPerHa.toLocaleString('fr-FR')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Taux de levée (%)</p>
            <p className="text-3xl font-bold text-green-700">{results.emergenceRatePct}%</p>
          </div>
        </div>
      </Card>

      {/* Remarks */}
      <Card>
        <h3 className="mb-3 text-base font-semibold text-gray-800">Remarques</h3>
        <div className="space-y-4">
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
          disabled={!assetId || !cropType || !observationDate || theoreticalDensity <= 0 || createDensity.isPending}
        >
          {createDensity.isPending ? 'Enregistrement...' : 'Enregistrer la fiche'}
        </Button>
      </div>
    </div>
  );
}
