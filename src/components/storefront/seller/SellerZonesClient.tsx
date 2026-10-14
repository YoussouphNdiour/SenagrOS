'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { trpc } from '@/lib/trpc';
import {
  formatXof,
  SENEGAL_REGIONS,
  upsertZoneSchema,
} from '@/lib/validators/storefront.validator';

type ZoneForm = z.input<typeof upsertZoneSchema>;
type ZoneFormOutput = z.output<typeof upsertZoneSchema>;

const EMPTY: ZoneForm = {
  name: '',
  region: 'Dakar',
  department: '',
  deliveryFee: 0,
  minOrderAmount: 0,
  estimatedDays: 1,
  isActive: true,
};

export function SellerZonesClient() {
  const utils = trpc.useUtils();
  const { data: zones, isLoading } = trpc.sellerCatalog.listZones.useQuery();
  const [open, setOpen] = useState(false);
  const upsert = trpc.sellerCatalog.upsertZone.useMutation({
    onSuccess: () => {
      utils.sellerCatalog.listZones.invalidate();
      setOpen(false);
    },
  });
  const remove = trpc.sellerCatalog.deleteZone.useMutation({
    onSuccess: () => utils.sellerCatalog.listZones.invalidate(),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ZoneForm, unknown, ZoneFormOutput>({
    resolver: zodResolver(upsertZoneSchema),
    defaultValues: EMPTY,
  });
  const num = { valueAsNumber: true } as const;
  type Row = NonNullable<typeof zones>[number];

  const edit = (zone?: Row) => {
    reset(
      zone
        ? {
            id: zone.id,
            name: zone.name,
            region: zone.region,
            department: zone.department ?? '',
            deliveryFee: Number(zone.deliveryFee),
            minOrderAmount: Number(zone.minOrderAmount ?? 0),
            estimatedDays: zone.estimatedDays ?? 1,
            isActive: !!zone.isActive,
          }
        : EMPTY,
    );
    setOpen(true);
  };

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">Zones où vous livrez, avec frais et délais</p>
        <Button onClick={() => edit()}>
          <Plus className="h-4 w-4" /> Nouvelle zone
        </Button>
      </div>
      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-400">Chargement…</p>
      ) : (
        <DataTable<Row>
          data={zones ?? []}
          emptyMessage="Aucune zone de livraison : les clients ne peuvent pas commander"
          columns={[
            {
              key: 'name',
              header: 'Zone',
              render: (z) => <span className="font-medium">{z.name}</span>,
            },
            {
              key: 'region',
              header: 'Région',
              render: (z) => `${z.region}${z.department ? ` / ${z.department}` : ''}`,
            },
            { key: 'deliveryFee', header: 'Frais', render: (z) => formatXof(z.deliveryFee) },
            {
              key: 'minOrderAmount',
              header: 'Commande min.',
              render: (z) => formatXof(z.minOrderAmount),
            },
            { key: 'estimatedDays', header: 'Délai', render: (z) => `${z.estimatedDays} j` },
            {
              key: 'isActive',
              header: 'Statut',
              render: (z) => (
                <Badge variant={z.isActive ? 'success' : 'default'}>
                  {z.isActive ? 'Active' : 'Inactive'}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (z) => (
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Modifier"
                    onClick={() => edit(z)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Supprimer"
                    onClick={() => {
                      if (window.confirm(`Supprimer la zone « ${z.name} » ?`))
                        remove.mutate({ id: z.id });
                    }}
                    className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ]}
          mobileRender={(z) => (
            <button
              type="button"
              onClick={() => edit(z)}
              className="w-full rounded-lg border border-gray-200 p-3 text-left"
            >
              <p className="font-medium">
                {z.name} <span className="text-xs text-gray-500">({z.region})</span>
              </p>
              <p className="text-sm text-gray-500">
                {formatXof(z.deliveryFee)} · {z.estimatedDays} j
              </p>
            </button>
          )}
        />
      )}
      {remove.data?.deactivated && (
        <p className="mt-3 text-sm text-orange-600">
          Zone utilisée par des commandes : elle a été désactivée.
        </p>
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Zone de livraison">
        <form onSubmit={handleSubmit((v) => upsert.mutate(v))} className="space-y-4">
          <Input
            id="zone-name"
            label="Nom"
            placeholder="Dakar Centre"
            error={errors.name?.message}
            {...register('name')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="zone-region"
              label="Région"
              options={SENEGAL_REGIONS.map((r) => ({ value: r, label: r }))}
              {...register('region')}
            />
            <Input id="zone-department" label="Département" {...register('department')} />
            <Input
              id="zone-fee"
              type="number"
              label="Frais de livraison (FCFA)"
              error={errors.deliveryFee?.message}
              {...register('deliveryFee', num)}
            />
            <Input
              id="zone-min"
              type="number"
              label="Commande minimum (FCFA)"
              {...register('minOrderAmount', num)}
            />
            <Input
              id="zone-days"
              type="number"
              label="Délai estimé (jours)"
              {...register('estimatedDays', num)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-green-600" {...register('isActive')} /> Zone
            active
          </label>
          {upsert.error && <p className="text-sm text-red-600">{upsert.error.message}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={upsert.isPending}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
