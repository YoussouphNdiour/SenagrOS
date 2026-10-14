'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  type ListingCategory,
  type ListSort,
  listingCategoryLabels,
  listSortLabels,
} from '@/lib/validators/storefront.validator';

interface CatalogueFiltersProps {
  categories: { category: string; count: number }[];
  regions: string[];
}

/** Catalogue filters, kept in the URL so results are server-rendered and shareable. */
export function CatalogueFilters({ categories, regions }: CatalogueFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(params.get('prix_min') ?? '');
  const [maxPrice, setMaxPrice] = useState(params.get('prix_max') ?? '');

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete('page');
    router.push(`${pathname}?${next.toString()}`);
  };

  const radio = (name: string, value: string, label: string, current: string | null) => (
    <label
      key={value}
      className="flex cursor-pointer items-center gap-2 py-1 text-sm text-gray-700"
    >
      <input
        type="radio"
        name={name}
        checked={current === value || (!current && value === '')}
        onChange={() => update({ [name]: value || null })}
        className="accent-green-600"
      />
      {label}
    </label>
  );

  const filters = (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-800">Catégorie</p>
        {radio('categorie', '', 'Toutes', params.get('categorie'))}
        {categories.map((c) =>
          radio(
            'categorie',
            c.category,
            `${listingCategoryLabels[c.category as ListingCategory] ?? c.category} (${c.count})`,
            params.get('categorie'),
          ),
        )}
      </div>

      <div>
        <label htmlFor="filter-region" className="mb-2 block text-sm font-semibold text-gray-800">
          Région d'origine
        </label>
        <select
          id="filter-region"
          value={params.get('region') ?? ''}
          onChange={(e) => update({ region: e.target.value || null })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Toutes les régions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ prix_min: minPrice || null, prix_max: maxPrice || null });
        }}
      >
        <p className="mb-2 text-sm font-semibold text-gray-800">Prix (FCFA)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Min"
            aria-label="Prix minimum"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Max"
            aria-label="Prix maximum"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-gray-100 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Appliquer
        </button>
      </form>

      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-800">
        <input
          type="checkbox"
          checked={params.get('bio') === '1'}
          onChange={(e) => update({ bio: e.target.checked ? '1' : null })}
          className="h-4 w-4 accent-green-600"
        />
        Bio uniquement
      </label>

      <div>
        <p className="mb-2 text-sm font-semibold text-gray-800">Note minimum</p>
        {radio('note_min', '', 'Toutes', params.get('note_min'))}
        {[4, 3, 2].map((n) =>
          radio('note_min', String(n), `${n} ★ et plus`, params.get('note_min')),
        )}
      </div>

      {params.toString() && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
        >
          <X className="h-4 w-4" /> Effacer les filtres
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filtres
        </button>
        <SortSelect
          value={(params.get('tri') as ListSort) ?? 'relevance'}
          onChange={(v) => update({ tri: v })}
        />
      </div>
      {open && <div className="mb-6 rounded-xl bg-white p-4 shadow-sm lg:hidden">{filters}</div>}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-20 rounded-xl bg-white p-5 shadow-sm">{filters}</div>
      </aside>
    </>
  );
}

export function SortSelect({
  value,
  onChange,
}: {
  value: ListSort;
  onChange: (v: string) => void;
}) {
  return (
    <select
      aria-label="Trier par"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
    >
      {Object.entries(listSortLabels).map(([k, label]) => (
        <option key={k} value={k}>
          {label}
        </option>
      ))}
    </select>
  );
}

/** Desktop sort control (top of the results grid). */
export function CatalogueSort() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <SortSelect
      value={(params.get('tri') as ListSort) ?? 'relevance'}
      onChange={(v) => {
        const next = new URLSearchParams(params.toString());
        next.set('tri', v);
        next.delete('page');
        router.push(`${pathname}?${next.toString()}`);
      }}
    />
  );
}
