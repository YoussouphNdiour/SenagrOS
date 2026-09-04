'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import {
  defaultPests,
  defaultDiseases,
  calculatePestTotals,
} from '@/lib/validators/observation.validator';

interface ObservationRow {
  name: string;
  category: 'ravageur' | 'maladie';
  targets: number[];
}

function buildInitialObservations(numTargets: number): ObservationRow[] {
  const pests: ObservationRow[] = defaultPests.map((name) => ({
    name,
    category: 'ravageur',
    targets: Array.from({ length: numTargets }, () => 0),
  }));
  const diseases: ObservationRow[] = defaultDiseases.map((name) => ({
    name,
    category: 'maladie',
    targets: Array.from({ length: numTargets }, () => 0),
  }));
  return [...pests, ...diseases];
}

export function PestDiseaseForm() {
  const router = useRouter();

  // Header fields
  const [assetId, setAssetId] = useState('');
  const [cropType, setCropType] = useState('');
  const [variety, setVariety] = useState('');
  const [observationDate, setObservationDate] = useState('');
  const [numTargets, setNumTargets] = useState(10);
  const [treatmentThreshold, setTreatmentThreshold] = useState(5);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [observedSurfaceHa, setObservedSurfaceHa] = useState('');

  // Grid state
  const [observations, setObservations] = useState<ObservationRow[]>(
    () => buildInitialObservations(10),
  );

  // Remarks
  const [supervisorRemarks, setSupervisorRemarks] = useState('');
  const [observerRemarks, setObserverRemarks] = useState('');

  // Parcels query
  const { data: parcels } = trpc.observation.listParcels.useQuery();
  const parcelOptions = useMemo(() => {
    return (parcels ?? []).map((p) => ({
      value: p.id,
      label: p.name,
    }));
  }, [parcels]);

  // Mutation
  const createMutation = trpc.observation.createPestDisease.useMutation({
    onSuccess: () => {
      router.push('/observations');
    },
  });

  // Resize targets when numTargets changes
  function handleNumTargetsChange(newNum: number) {
    const clamped = Math.max(1, Math.min(50, newNum));
    setNumTargets(clamped);
    setObservations((prev) =>
      prev.map((row) => {
        const resized = Array.from({ length: clamped }, (_, i) =>
          i < row.targets.length ? row.targets[i] : 0,
        );
        return { ...row, targets: resized };
      }),
    );
  }

  // Update a single cell
  function handleCellChange(rowIndex: number, targetIndex: number, value: number) {
    setObservations((prev) => {
      const updated = [...prev];
      const row = { ...updated[rowIndex] };
      const targets = [...row.targets];
      targets[targetIndex] = Math.max(0, value);
      row.targets = targets;
      updated[rowIndex] = row;
      return updated;
    });
  }

  // Computed totals per row
  const rowTotals = useMemo(
    () => observations.map((row) => calculatePestTotals(row.targets, numTargets)),
    [observations, numTargets],
  );

  // Submit
  function handleSubmit() {
    createMutation.mutate({
      assetId,
      cropType,
      variety: variety || undefined,
      observationDate,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      observedSurfaceHa: Number(observedSurfaceHa) || undefined,
      numTargets,
      treatmentThreshold,
      observations: observations.map((o) => ({
        pestOrDisease: o.name,
        category: o.category,
        targets: o.targets,
      })),
      observerRemarks: observerRemarks || undefined,
      supervisorRemarks: supervisorRemarks || undefined,
    });
  }

  const ravageurRows = observations
    .map((o, i) => ({ ...o, originalIndex: i }))
    .filter((o) => o.category === 'ravageur');
  const maladieRows = observations
    .map((o, i) => ({ ...o, originalIndex: i }))
    .filter((o) => o.category === 'maladie');

  function renderRow(row: ObservationRow & { originalIndex: number }) {
    const totals = rowTotals[row.originalIndex];
    const isAlert = totals.pctInfested > treatmentThreshold;

    return (
      <tr key={row.originalIndex} className="border-b border-gray-100">
        <td className="sticky left-0 bg-white px-2 py-1 text-xs font-medium text-gray-700 whitespace-nowrap">
          {row.name}
        </td>
        {row.targets.map((val, ti) => (
          <td key={ti} className="px-0.5 py-1">
            <input
              type="number"
              min="0"
              value={val}
              onChange={(e) =>
                handleCellChange(row.originalIndex, ti, parseInt(e.target.value, 10) || 0)
              }
              className="w-12 rounded border border-gray-200 px-1 py-0.5 text-center text-xs focus:border-green-500 focus:outline-none"
            />
          </td>
        ))}
        <td className="px-2 py-1 text-center text-xs font-semibold">{totals.total}</td>
        <td className="px-2 py-1 text-center text-xs">{totals.pctInfested.toFixed(2)}%</td>
        <td className="px-2 py-1 text-center text-xs">{treatmentThreshold}%</td>
        <td className="px-2 py-1 text-center">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
              isAlert ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {isAlert ? 'ALERTE' : 'OK'}
          </span>
        </td>
      </tr>
    );
  }

  return (
    <Card>
      <h2 className="mb-6 text-xl font-bold text-gray-800">
        Observation Maladies-Ravageurs
      </h2>

      {/* Header fields */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label="Parcelle"
          options={parcelOptions}
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          placeholder="Choisir une parcelle"
        />
        <Input
          label="Culture"
          type="text"
          value={cropType}
          onChange={(e) => setCropType(e.target.value)}
        />
        <Input
          label="Vari\u00e9t\u00e9"
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
          label="Nombre de cibles"
          type="number"
          min={1}
          max={50}
          value={numTargets}
          onChange={(e) => handleNumTargetsChange(parseInt(e.target.value, 10) || 1)}
        />
        <Input
          label="Seuil traitement (%)"
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={treatmentThreshold}
          onChange={(e) => setTreatmentThreshold(parseFloat(e.target.value) || 0)}
        />
        <Input
          label="Heure d\u00e9but"
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
          label="Surface observ\u00e9e (ha)"
          type="number"
          value={observedSurfaceHa}
          onChange={(e) => setObservedSurfaceHa(e.target.value)}
        />
      </div>

      {/* Observation Grid */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold text-gray-700">Grille d'observation</h3>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="sticky left-0 bg-gray-50 px-2 py-2 text-left text-xs font-semibold text-gray-600">
                  Ravageur / Maladie
                </th>
                {Array.from({ length: numTargets }, (_, i) => (
                  <th
                    key={i}
                    className="px-1 py-2 text-center text-xs font-semibold text-gray-600"
                  >
                    B{i + 1}
                  </th>
                ))}
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600">
                  Total
                </th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600">
                  % Infest\u00e9
                </th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600">
                  Seuil
                </th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600">
                  Alerte
                </th>
              </tr>
            </thead>
            <tbody>
              {/* RAVAGEURS section */}
              <tr className="bg-gray-50">
                <td
                  colSpan={numTargets + 5}
                  className="px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-500"
                >
                  Ravageurs
                </td>
              </tr>
              {ravageurRows.map(renderRow)}

              {/* MALADIES section */}
              <tr className="bg-gray-50">
                <td
                  colSpan={numTargets + 5}
                  className="px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-500"
                >
                  Maladies
                </td>
              </tr>
              {maladieRows.map(renderRow)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remarks */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Pr\u00e9conisation traitement
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            rows={3}
            value={supervisorRemarks}
            onChange={(e) => setSupervisorRemarks(e.target.value)}
            placeholder="Remarques du superviseur..."
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Remarques observateur
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            rows={3}
            value={observerRemarks}
            onChange={(e) => setObserverRemarks(e.target.value)}
            placeholder="Remarques de l'observateur..."
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!assetId || !cropType || !observationDate || createMutation.isPending}
        >
          {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer l\u0027observation'}
        </Button>
      </div>

      {createMutation.isError && (
        <p className="mt-3 text-sm text-red-600">
          Erreur: {createMutation.error.message}
        </p>
      )}
    </Card>
  );
}
