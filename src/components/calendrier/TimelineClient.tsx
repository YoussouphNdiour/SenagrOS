'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cropTypeLabels, stageStatusLabels } from '@/lib/validators/calendar.validator';

interface StageStatusItem {
  stageName: string;
  expectedDate: string;
  actualDate: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

interface TimelineEntry {
  id: string;
  assetName: string;
  calendarName: string;
  cropType: string;
  variety: string | null;
  sowingDate: string;
  totalDays: number | null;
  status: string | null;
  stageStatuses: unknown;
}

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function getStageColor(status: string, expectedDate: string, actualDate: string | null): string {
  if (status === 'completed') {
    if (actualDate && actualDate > expectedDate) return 'bg-orange-500'; // late
    return 'bg-green-500'; // on time
  }
  if (status === 'in_progress') return 'bg-blue-500';
  if (status === 'skipped') return 'bg-yellow-400';
  return 'bg-gray-300'; // pending
}

export function TimelineClient() {
  const [cropTypeFilter, setCropTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStage, setSelectedStage] = useState<{
    entry: TimelineEntry;
    stage: StageStatusItem;
  } | null>(null);

  const { data: items, isLoading } = trpc.calendar.getTimeline.useQuery({
    cropType: cropTypeFilter || undefined,
    status: (statusFilter || undefined) as 'active' | 'completed' | 'cancelled' | undefined,
  });

  const updateMutation = trpc.calendar.updateStageStatus.useMutation({
    onSuccess: () => {
      setSelectedStage(null);
    },
  });

  // Calculate the date range for the timeline
  const { startDate, monthHeaders, totalDays: timelineDays } = useMemo(() => {
    if (!items || items.length === 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 6, 0);
      return {
        startDate: start,
        endDate: end,
        monthHeaders: [] as { label: string; widthPct: number }[],
        totalDays: 180,
      };
    }

    let minDate = new Date('2100-01-01');
    let maxDate = new Date('1900-01-01');

    for (const item of items) {
      const sowing = new Date(item.sowingDate);
      if (sowing < minDate) minDate = new Date(sowing);

      const total = item.totalDays ?? 90;
      const endD = new Date(sowing);
      endD.setDate(endD.getDate() + total);
      if (endD > maxDate) maxDate = new Date(endD);
    }

    // Add 2 weeks margin
    minDate.setDate(minDate.getDate() - 14);
    maxDate.setDate(maxDate.getDate() + 14);

    // Align to month start/end
    const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);

    const total = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Build month headers
    const months: { label: string; widthPct: number }[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const monthStart = new Date(cur);
      const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);

      const effectiveStart = monthStart < start ? start : monthStart;
      const effectiveEnd = monthEnd > end ? end : monthEnd;
      const days = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      months.push({
        label: `${MONTH_NAMES[cur.getMonth()]} ${cur.getFullYear()}`,
        widthPct: (days / total) * 100,
      });

      cur.setMonth(cur.getMonth() + 1);
      cur.setDate(1);
    }

    return { startDate: start, endDate: end, monthHeaders: months, totalDays: total };
  }, [items]);

  const getPositionPct = (dateStr: string): number => {
    const d = new Date(dateStr);
    const diff = Math.ceil((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return (diff / timelineDays) * 100;
  };

  const cropTypeOptions = [
    { value: '', label: 'Toutes les cultures' },
    ...Object.entries(cropTypeLabels).map(([v, l]) => ({ value: v, label: l })),
  ];

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' },
  ];

  if (isLoading) {
    return <p className="text-sm text-gray-500">Chargement de la timeline...</p>;
  }

  const entries = (items ?? []) as TimelineEntry[];

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-48">
          <Select
            options={cropTypeOptions}
            value={cropTypeFilter}
            onChange={(e) => setCropTypeFilter(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {entries.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-gray-500">
            <p className="text-lg font-medium">Aucun calendrier assigné</p>
            <p className="mt-1 text-sm">Assignez un modèle à une parcelle pour voir la timeline</p>
          </div>
        </Card>
      ) : (
        <Card>
          {/* Legend */}
          <div className="mb-4 flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-green-500" /> Terminé à temps
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-orange-500" /> Terminé en retard
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-500" /> En cours
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-gray-300" /> À venir
            </span>
          </div>

          {/* Timeline header */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Month headers */}
              <div className="flex border-b border-gray-200">
                <div className="w-48 shrink-0 px-3 py-2 text-xs font-medium text-gray-500">
                  Parcelle
                </div>
                <div className="flex flex-1">
                  {monthHeaders.map((m) => (
                    <div
                      key={m.label}
                      className="border-l border-gray-100 px-1 py-2 text-center text-xs text-gray-500"
                      style={{ width: `${m.widthPct}%` }}
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline rows */}
              {entries.map((entry) => {
                const statuses = (entry.stageStatuses as StageStatusItem[]) ?? [];
                const totalD = entry.totalDays ?? 90;
                const sowingPct = getPositionPct(entry.sowingDate);
                const barWidthPct = (totalD / timelineDays) * 100;

                return (
                  <div key={entry.id} className="flex border-b border-gray-100 hover:bg-gray-50">
                    {/* Label */}
                    <div className="w-48 shrink-0 px-3 py-3">
                      <p className="text-sm font-medium text-gray-800">{entry.assetName}</p>
                      <p className="text-xs text-gray-500">
                        {cropTypeLabels[entry.cropType] ?? entry.cropType}
                        {entry.variety ? ` — ${entry.variety}` : ''}
                      </p>
                    </div>

                    {/* Timeline bar */}
                    <div className="relative flex-1 py-3">
                      {/* Cycle bar */}
                      <div
                        className="absolute h-6 rounded-full bg-green-100 opacity-60"
                        style={{
                          left: `${sowingPct}%`,
                          width: `${barWidthPct}%`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                        }}
                      />

                      {/* Stage milestones */}
                      {statuses.map((stage) => {
                        const pct = getPositionPct(stage.expectedDate);
                        const color = getStageColor(
                          stage.status,
                          stage.expectedDate,
                          stage.actualDate,
                        );

                        return (
                          <button
                            type="button"
                            key={stage.stageName}
                            className={`absolute z-10 h-4 w-4 rounded-full ${color} border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition-transform`}
                            style={{
                              left: `${pct}%`,
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                            }}
                            title={`${stage.stageName}: ${stage.expectedDate}`}
                            onClick={() => setSelectedStage({ entry, stage })}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Stage detail popup */}
      {selectedStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              {selectedStage.stage.stageName}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Parcelle</span>
                <span className="font-medium">{selectedStage.entry.assetName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Culture</span>
                <span className="font-medium">
                  {cropTypeLabels[selectedStage.entry.cropType] ?? selectedStage.entry.cropType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date prévue</span>
                <span className="font-medium">
                  {new Date(selectedStage.stage.expectedDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date réelle</span>
                <span className="font-medium">
                  {selectedStage.stage.actualDate
                    ? new Date(selectedStage.stage.actualDate).toLocaleDateString('fr-FR')
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Statut</span>
                <Badge
                  variant={
                    selectedStage.stage.status === 'completed'
                      ? 'success'
                      : selectedStage.stage.status === 'in_progress'
                        ? 'info'
                        : selectedStage.stage.status === 'skipped'
                          ? 'warning'
                          : 'default'
                  }
                >
                  {stageStatusLabels[selectedStage.stage.status] ?? selectedStage.stage.status}
                </Badge>
              </div>
              {selectedStage.stage.status === 'completed' &&
                selectedStage.stage.actualDate &&
                selectedStage.stage.actualDate > selectedStage.stage.expectedDate && (
                  <div className="rounded-lg bg-orange-50 p-3 text-orange-700">
                    Retard de{' '}
                    {Math.ceil(
                      (new Date(selectedStage.stage.actualDate).getTime() -
                        new Date(selectedStage.stage.expectedDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    )}{' '}
                    jour(s)
                  </div>
                )}
            </div>

            {/* Mark as completed form */}
            {(selectedStage.stage.status === 'pending' ||
              selectedStage.stage.status === 'in_progress') && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="mb-2 text-sm font-medium text-gray-700">Marquer comme terminé</p>
                <div className="flex gap-2">
                  <input
                    type="date"
                    id="actual-date-input"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                  <Button
                    onClick={() => {
                      const dateInput = document.getElementById('actual-date-input') as HTMLInputElement;
                      updateMutation.mutate({
                        parcelCalendarId: selectedStage.entry.id,
                        stageName: selectedStage.stage.stageName,
                        actualDate: dateInput.value,
                        status: 'completed',
                      });
                    }}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? '...' : 'Valider'}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedStage(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
