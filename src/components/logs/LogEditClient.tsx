'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ComboboxAsync } from '@/components/ui/ComboboxAsync';
import { updateLogSchema, logTypeValues, logStatusValues } from '@/lib/validators/log.validator';
import type { z } from 'zod';

type UpdateLogInput = z.infer<typeof updateLogSchema>;

type LogType = (typeof logTypeValues)[number];
type LogStatus = (typeof logStatusValues)[number];

const typeLabels: Record<LogType, string> = {
  activity: 'Activite',
  observation: 'Observation',
  input: 'Intrant',
  harvest: 'Recolte',
  seeding: 'Semis',
  transplanting: 'Repiquage',
  birth: 'Naissance',
  maintenance: 'Maintenance',
  medical: 'Medical',
  lab_test: 'Analyse labo',
  movement: 'Mouvement',
  irrigation: 'Irrigation',
};

const statusLabels: Record<LogStatus, string> = {
  pending: 'En attente',
  done: 'Termine',
  cancelled: 'Annule',
};

interface LogEditClientProps {
  logId: string;
}

interface UserItem {
  id: string;
  name: string;
}

export function LogEditClient({ logId }: LogEditClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const farmId = (session?.user as { farmId?: string } | undefined)?.farmId ?? '';
  const { data: log, isLoading } = trpc.log.getById.useQuery({ id: logId });
  const [assigneeId, setAssigneeId] = useState<string | null>(null);

  const updateMutation = trpc.log.update.useMutation({
    onSuccess: () => router.push(`/logs/${logId}`),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateLogInput>({
    resolver: zodResolver(updateLogSchema) as never,
    defaultValues: {
      id: logId,
    },
  });

  // Pre-fill form when log data is loaded
  useEffect(() => {
    if (log) {
      reset({
        id: logId,
        name: log.name,
        type: log.type as LogType,
        status: (log.status as LogStatus) ?? 'pending',
        timestamp: log.timestamp
          ? new Date(log.timestamp).toISOString().slice(0, 16)
          : '',
        notes: log.notes ?? '',
        data: (log.data as Record<string, unknown>) ?? {},
      });
      setAssigneeId(log.assigneeId ?? null);
    }
  }, [log, logId, reset]);

  const searchWorkers = async (query: string): Promise<UserItem[]> => {
    const res = await fetch(`/api/trpc/farmMember.list?input=${encodeURIComponent(JSON.stringify({ json: { search: query || undefined } }))}`);
    const json = await res.json();
    return (json?.result?.data?.json?.items ?? []).map((m: { id: string; name: string | null }) => ({
      id: m.id,
      name: m.name ?? 'Sans nom',
    }));
  };

  const dataEntries =
    log?.data !== null &&
    log?.data !== undefined &&
    typeof log?.data === 'object' &&
    !Array.isArray(log.data)
      ? Object.entries(log.data as Record<string, unknown>).filter(
          ([, v]) => v !== null && v !== undefined && v !== '',
        )
      : [];

  const onSubmit = (values: UpdateLogInput) => {
    updateMutation.mutate({ ...values, assigneeId });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Log introuvable
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-6">
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Informations generales</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Nom
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Type (disabled) */}
          <div>
            <label htmlFor="type" className="mb-1 block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              id="type"
              {...register('type')}
              disabled
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {logTypeValues.map((t) => (
                <option key={t} value={t}>
                  {typeLabels[t]}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
              Statut
            </label>
            <select
              id="status"
              {...register('status')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {logStatusValues.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>
            )}
          </div>

          {/* Timestamp */}
          <div>
            <label htmlFor="timestamp" className="mb-1 block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              id="timestamp"
              type="datetime-local"
              {...register('timestamp')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            {errors.timestamp && (
              <p className="mt-1 text-xs text-red-600">{errors.timestamp.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            {errors.notes && (
              <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>
            )}
          </div>
        </div>
      </Card>

      {/* JSONB data fields */}
      {dataEntries.length > 0 && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Donnees specifiques</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {dataEntries.map(([key]) => (
              <div key={key}>
                <label
                  htmlFor={`data-${key}`}
                  className="mb-1 block text-sm font-medium text-gray-700 capitalize"
                >
                  {key.replace(/_/g, ' ')}
                </label>
                <input
                  id={`data-${key}`}
                  type="text"
                  {...register(`data.${key}` as const)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Responsable */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Responsable</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <ComboboxAsync<UserItem>
            label="Responsable"
            placeholder="Choisir un responsable..."
            value={assigneeId ?? undefined}
            onChange={(val) => setAssigneeId(val || null)}
            searchFn={searchWorkers}
            getLabel={(item) => item.name}
            getValue={(item) => item.id}
          />
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>
    </form>
  );
}
