'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Archive, Eye, EyeOff, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { trpc } from '@/lib/trpc';
import {
  formatQuantity,
  formatXof,
  type ListingCategory,
  listingCategoryEnum,
  listingCategoryLabels,
  type ListingUnit,
  listingUnitEnum,
  listingUnitLabels,
  SENEGAL_REGIONS,
  upsertListingSchema,
} from '@/lib/validators/storefront.validator';
import { PLACEHOLDER_PHOTO } from '../photos';

const optionalNumber = z
  .union([z.number(), z.nan()])
  .optional()
  .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v));

const listingFormSchema = z.object({
  name: z.string().trim().min(2, 'Minimum 2 caractères'),
  description: z.string().optional(),
  category: listingCategoryEnum,
  unit: listingUnitEnum,
  stockAvailable: z.number({ error: 'Stock requis' }).min(0),
  minOrderQuantity: z.number({ error: 'Requis' }).positive(),
  originRegion: z.string().optional(),
  isBio: z.boolean(),
  isPublished: z.boolean(),
  harvestDate: z.string().optional(),
  shelfLifeDays: optionalNumber,
  photoUrl: z.string().optional(),
  priceDetail: z.number({ error: 'Prix détail requis' }).positive('Prix requis'),
  priceSemiGros: optionalNumber,
  minSemiGros: optionalNumber,
  priceGros: optionalNumber,
  minGros: optionalNumber,
});
type ListingForm = z.input<typeof listingFormSchema>;
type ListingFormOutput = z.output<typeof listingFormSchema>;

const EMPTY: ListingForm = {
  name: '',
  description: '',
  category: 'legumes',
  unit: 'kg',
  stockAvailable: 0,
  minOrderQuantity: 1,
  originRegion: '',
  isBio: false,
  isPublished: true,
  harvestDate: '',
  photoUrl: '',
  priceDetail: 0,
  minSemiGros: 10,
  minGros: 100,
};

export function SellerListingsClient() {
  const utils = trpc.useUtils();
  const { data: listings, isLoading } = trpc.sellerCatalog.listListings.useQuery();
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [serverError, setServerError] = useState('');
  const refresh = () => {
    utils.sellerCatalog.listListings.invalidate();
    utils.sellerOrders.stats.invalidate();
  };
  const upsert = trpc.sellerCatalog.upsertListing.useMutation({
    onSuccess: () => {
      refresh();
      setEditing(null);
    },
    onError: (e) => setServerError(e.message),
  });
  const setPublished = trpc.sellerCatalog.setPublished.useMutation({ onSuccess: refresh });
  const archive = trpc.sellerCatalog.archiveListing.useMutation({ onSuccess: refresh });

  const form = useForm<ListingForm, unknown, ListingFormOutput>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: EMPTY,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const openEditor = (id: string | 'new') => {
    setServerError('');
    const l = id === 'new' ? null : listings?.find((x) => x.id === id);
    if (!l) {
      reset(EMPTY);
    } else {
      const tier = (t: string) => l.tiers.find((x) => x.buyerType === t);
      reset({
        name: l.name,
        description: l.description ?? '',
        category: l.category as ListingCategory,
        unit: (l.unit ?? 'kg') as ListingUnit,
        stockAvailable: Number(l.stockAvailable),
        minOrderQuantity: Number(l.minOrderQuantity ?? 1),
        originRegion: l.originRegion ?? '',
        isBio: !!l.isBio,
        isPublished: !!l.isPublished,
        harvestDate: l.harvestDate ?? '',
        shelfLifeDays: l.shelfLifeDays ?? undefined,
        photoUrl: l.photos?.[0]?.url ?? '',
        priceDetail: Number(tier('particulier')?.price ?? l.basePrice),
        priceSemiGros: tier('superette') ? Number(tier('superette')?.price) : undefined,
        minSemiGros: tier('superette') ? Number(tier('superette')?.minQuantity) : 10,
        priceGros: tier('grande_surface') ? Number(tier('grande_surface')?.price) : undefined,
        minGros: tier('grande_surface') ? Number(tier('grande_surface')?.minQuantity) : 100,
      });
    }
    setEditing(id);
  };

  const onSubmit = (v: ListingFormOutput) => {
    setServerError('');
    const tiers: z.input<typeof upsertListingSchema>['tiers'] = [
      { buyerType: 'particulier', price: v.priceDetail, minQuantity: v.minOrderQuantity },
    ];
    if (v.priceSemiGros)
      tiers.push({
        buyerType: 'superette',
        price: v.priceSemiGros,
        minQuantity: v.minSemiGros ?? 1,
      });
    if (v.priceGros)
      tiers.push({ buyerType: 'grande_surface', price: v.priceGros, minQuantity: v.minGros ?? 1 });
    const payload = {
      id: editing && editing !== 'new' ? editing : undefined,
      name: v.name,
      description: v.description || undefined,
      category: v.category,
      unit: v.unit,
      stockAvailable: v.stockAvailable,
      minOrderQuantity: v.minOrderQuantity,
      originRegion: v.originRegion || undefined,
      isBio: v.isBio,
      isPublished: v.isPublished,
      harvestDate: v.harvestDate || undefined,
      shelfLifeDays: v.shelfLifeDays,
      photos: v.photoUrl ? [{ url: v.photoUrl, alt: v.name }] : [],
      tiers,
    };
    const parsed = upsertListingSchema.safeParse(payload);
    if (!parsed.success) {
      setServerError(parsed.error.issues[0]?.message ?? 'Formulaire invalide');
      return;
    }
    upsert.mutate(payload);
  };

  const num = { valueAsNumber: true } as const;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{listings?.length ?? 0} produit(s) au catalogue</p>
        <Button onClick={() => openEditor('new')} data-testid="new-listing">
          <Plus className="h-4 w-4" /> Publier un produit
        </Button>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-500">Chargement…</p>
      ) : !listings?.length ? (
        <p className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500">
          Aucun produit. Publiez votre premier produit avec sa grille tarifaire.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {listings.map((l) => {
            const price = (t: string) => l.tiers.find((x) => x.buyerType === t);
            return (
              <li
                key={l.id}
                className="flex flex-wrap items-center gap-4 py-3"
                data-testid="seller-listing"
              >
                {/* biome-ignore lint/performance/noImgElement: local SVG placeholders */}
                <img
                  src={l.photos?.[0]?.url ?? PLACEHOLDER_PHOTO}
                  alt=""
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div className="min-w-48 flex-1">
                  <p className="font-medium text-gray-800">
                    {l.name} {l.isBio && <Badge variant="success">Bio</Badge>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {listingCategoryLabels[l.category as ListingCategory]} · Stock{' '}
                    {formatQuantity(l.stockAvailable)} {l.unit}
                  </p>
                </div>
                <div className="text-xs text-gray-600">
                  <p>Détail : {formatXof(price('particulier')?.price ?? l.basePrice)}</p>
                  {price('superette') && (
                    <p>
                      Semi-gros : {formatXof(price('superette')?.price)} (≥{' '}
                      {formatQuantity(price('superette')?.minQuantity ?? 1)})
                    </p>
                  )}
                  {price('grande_surface') && (
                    <p>
                      Gros : {formatXof(price('grande_surface')?.price)} (≥{' '}
                      {formatQuantity(price('grande_surface')?.minQuantity ?? 1)})
                    </p>
                  )}
                </div>
                <Badge variant={l.isPublished ? 'success' : 'default'}>
                  {l.isPublished ? 'Publié' : 'Masqué'}
                </Badge>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Modifier"
                    onClick={() => openEditor(l.id)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={l.isPublished ? 'Masquer' : 'Publier'}
                    onClick={() => setPublished.mutate({ id: l.id, isPublished: !l.isPublished })}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                  >
                    {l.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    aria-label="Archiver"
                    onClick={() => {
                      if (window.confirm(`Archiver « ${l.name} » ?`)) archive.mutate({ id: l.id });
                    }}
                    className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-700"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Publier un produit' : 'Modifier le produit'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="name"
              label="Nom du produit"
              error={errors.name?.message}
              {...register('name')}
            />
            <Select
              id="category"
              label="Catégorie"
              options={listingCategoryEnum.options.map((c) => ({
                value: c,
                label: listingCategoryLabels[c],
              }))}
              {...register('category')}
            />
            <Select
              id="unit"
              label="Unité"
              options={listingUnitEnum.options.map((u) => ({
                value: u,
                label: listingUnitLabels[u],
              }))}
              {...register('unit')}
            />
            <Select
              id="originRegion"
              label="Région d'origine"
              options={[
                { value: '', label: '—' },
                ...[
                  'Niayes',
                  'Vallée du fleuve',
                  'Casamance',
                  'Bassin arachidier',
                  ...SENEGAL_REGIONS,
                ].map((r) => ({ value: r, label: r })),
              ]}
              {...register('originRegion')}
            />
            <Input
              id="stockAvailable"
              type="number"
              step="any"
              label="Stock disponible"
              error={errors.stockAvailable?.message}
              {...register('stockAvailable', num)}
            />
            <Input
              id="minOrderQuantity"
              type="number"
              step="any"
              label="Quantité minimum de commande"
              error={errors.minOrderQuantity?.message}
              {...register('minOrderQuantity', num)}
            />
            <Input
              id="harvestDate"
              type="date"
              label="Date de récolte"
              {...register('harvestDate')}
            />
            <Input
              id="shelfLifeDays"
              type="number"
              label="Conservation (jours)"
              {...register('shelfLifeDays', num)}
            />
          </div>
          <Input
            id="photoUrl"
            label="URL de la photo"
            placeholder="/storefront/products/tomates.svg"
            {...register('photoUrl')}
          />
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
              {...register('description')}
            />
          </div>

          <fieldset className="rounded-lg border border-gray-200 p-4">
            <legend className="px-1 text-sm font-semibold text-gray-800">
              Grille tarifaire (FCFA / unité)
            </legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                id="priceDetail"
                type="number"
                label="Particulier (détail)"
                error={errors.priceDetail?.message}
                {...register('priceDetail', num)}
              />
              <div className="space-y-2">
                <Input
                  id="priceSemiGros"
                  type="number"
                  label="Superette (semi-gros)"
                  {...register('priceSemiGros', num)}
                />
                <Input
                  id="minSemiGros"
                  type="number"
                  step="any"
                  label="à partir de"
                  {...register('minSemiGros', num)}
                />
              </div>
              <div className="space-y-2">
                <Input
                  id="priceGros"
                  type="number"
                  label="Grande surface (gros)"
                  {...register('priceGros', num)}
                />
                <Input
                  id="minGros"
                  type="number"
                  step="any"
                  label="à partir de"
                  {...register('minGros', num)}
                />
              </div>
            </div>
          </fieldset>

          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-green-600" {...register('isBio')} /> Bio
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-green-600" {...register('isPublished')} />{' '}
              Publié sur la vitrine
            </label>
          </div>

          {serverError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Annuler
            </Button>
            <Button type="submit" disabled={upsert.isPending}>
              {upsert.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
