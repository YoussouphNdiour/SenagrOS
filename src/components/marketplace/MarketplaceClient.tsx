'use client';

import { useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { ProductCard } from './ProductCard';
import { MarketplaceKpis } from './MarketplaceKpis';
import { OrderModal } from './OrderModal';
import { ProductDetailModal } from './ProductDetailModal';
import {
  productCategoryLabels,
  type ProductCategory,
} from '@/lib/validators/marketplace.validator';

export function MarketplaceClient() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bioOnly, setBioOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [viewProductId, setViewProductId] = useState<string | null>(null);
  const [orderProductId, setOrderProductId] = useState<string | null>(null);

  const { data, isLoading } = trpc.marketplace.listAll.useQuery({
    search: search || undefined,
    category: category || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    bioOnly: bioOnly || undefined,
    inStockOnly: inStockOnly || undefined,
    page,
    limit: 25,
  });

  function resetFilters() {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setBioOnly(false);
    setInStockOnly(false);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
        <p className="text-sm text-gray-500">
          Découvre et achète directement auprès des fermes.
        </p>
      </div>

      <MarketplaceKpis />

      {/* Search & Filters */}
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit, une catégorie, une ferme..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value as ProductCategory | ''); setPage(1); }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          >
            <option value="">Catégorie — Tout</option>
            {Object.entries(productCategoryLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Prix min"
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
            className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Prix max"
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
            className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={bioOnly}
              onChange={(e) => { setBioOnly(e.target.checked); setPage(1); }}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            Bio uniquement
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => { setInStockOnly(e.target.checked); setPage(1); }}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            En stock
          </label>

          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
            <span>{data?.total ?? 0} produit{(data?.total ?? 0) > 1 ? 's' : ''}</span>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-600"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
        </div>
      ) : !data?.items.length ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <p className="text-gray-500">Aucun produit disponible.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onView={setViewProductId}
                onOrder={setOrderProductId}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.total > 25 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="flex items-center px-3 text-sm text-gray-600">
                Page {page} / {Math.ceil(data.total / 25)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 25 >= data.total}
                className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          )}

          <p className="text-center text-sm text-gray-400">
            Tu as vu tous les produits.
          </p>
        </>
      )}

      {/* Modals */}
      {viewProductId && (
        <ProductDetailModal
          productId={viewProductId}
          onClose={() => setViewProductId(null)}
          onOrder={(id) => { setViewProductId(null); setOrderProductId(id); }}
        />
      )}
      {orderProductId && (
        <OrderModal
          productId={orderProductId}
          onClose={() => setOrderProductId(null)}
        />
      )}
    </div>
  );
}
