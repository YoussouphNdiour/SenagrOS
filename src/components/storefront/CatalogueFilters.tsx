'use client';

import { ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
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

const fieldClass =
  'w-full rounded-md border border-line px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

/** Catalogue filters, kept in the URL so results are server-rendered and shareable. */
export function CatalogueFilters({ categories, regions }: CatalogueFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(params.get('prix_min') ?? '');
  const [maxPrice, setMaxPrice] = useState(params.get('prix_max') ?? '');

  const hrefWith = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete('page');
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };
  const update = (changes: Record<string, string | null>) => router.push(hrefWith(changes));
  const currentCategory = params.get('categorie');

  const filters = (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink">Rayons</h2>
        <ul className="divide-y divide-line border-y border-line">
          {[{ category: '', count: categories.reduce((s, c) => s + c.count, 0) }, ...categories].map(
            (c) => {
              const active = (currentCategory ?? '') === c.category;
              return (
                <li key={c.category || 'all'}>
                  <Link
                    href={hrefWith({ categorie: c.category || null })}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center justify-between py-2.5 text-sm ${
                      active ? 'font-semibold text-brand' : 'text-ink hover:text-brand'
                    }`}
                  >
                    <span>
                      {c.category
                        ? (listingCategoryLabels[c.category as ListingCategory] ?? c.category)
                        : 'Tous les produits'}
                      <span className="ml-1 text-muted">({c.count})</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted" aria-hidden />
                  </Link>
                </li>
              );
            },
          )}
        </ul>
      </div>

      <div>
        <label htmlFor="filter-region" className="mb-3 block text-lg font-semibold text-ink">
          Région d'origine
        </label>
        <select
          id="filter-region"
          value={params.get('region') ?? ''}
          onChange={(e) => update({ region: e.target.value || null })}
          className={fieldClass}
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
        <fieldset>
          <legend className="mb-3 text-lg font-semibold text-ink">Prix (FCFA)</legend>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Min"
              aria-label="Prix minimum"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className={fieldClass}
            />
            <span className="text-muted" aria-hidden>
              –
            </span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Max"
              aria-label="Prix maximum"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className={fieldClass}
            />
          </div>
          <button
            type="submit"
            className="mt-3 w-full rounded-md border border-ink py-2 text-sm font-semibold text-ink hover:bg-ink hover:text-white"
          >
            Appliquer
          </button>
        </fieldset>
      </form>

      <fieldset>
        <legend className="mb-3 text-lg font-semibold text-ink">Qualité</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={params.get('bio') === '1'}
            onChange={(e) => update({ bio: e.target.checked ? '1' : null })}
            className="h-4 w-4 accent-brand"
          />
          Bio uniquement
        </label>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-lg font-semibold text-ink">Note minimum</legend>
        {[
          ['', 'Toutes'],
          ['4', '4 ★ et plus'],
          ['3', '3 ★ et plus'],
          ['2', '2 ★ et plus'],
        ].map(([value, label]) => (
          <label key={value || 'all'} className="flex cursor-pointer items-center gap-2 py-1 text-sm text-ink">
            <input
              type="radio"
              name="note_min"
              checked={(params.get('note_min') ?? '') === value}
              onChange={() => update({ note_min: value || null })}
              className="accent-brand"
            />
            {label}
          </label>
        ))}
      </fieldset>

      {params.toString() && (
        <Link
          href={pathname}
          className="inline-flex items-center gap-1 text-sm font-medium text-red-700 hover:underline"
        >
          <X className="h-4 w-4" aria-hidden /> Effacer les filtres
        </Link>
      )}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mb-4 inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filtres
      </button>
      {open && <div className="mb-6 rounded-lg border border-line p-4 lg:hidden">{filters}</div>}
      <aside className="hidden w-64 shrink-0 lg:block">{filters}</aside>
    </>
  );
}

export function SortSelect({ value, onChange }: { value: ListSort; onChange: (v: string) => void }) {
  return (
    <select
      aria-label="Trier par"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
    >
      {Object.entries(listSortLabels).map(([k, label]) => (
        <option key={k} value={k}>
          Trier : {label}
        </option>
      ))}
    </select>
  );
}

/** Sort control above the results grid. */
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
