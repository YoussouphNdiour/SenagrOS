'use client';

import { useState } from 'react';
import { Plus, Search, Eye, EyeOff, Trash2, Pencil } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/Badge';
import { SellerKpis } from './SellerKpis';
import { ProductCreateForm } from './ProductCreateForm';
import {
  productCategoryLabels,
  type ProductCategory,
} from '@/lib/validators/marketplace.validator';

export function MyProductsClient() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.marketplace.listMyProducts.useQuery({
    search: search || undefined,
    page,
    limit: 25,
  });

  const togglePublish = trpc.marketplace.updateProduct.useMutation({
    onSuccess: () => {
      utils.marketplace.listMyProducts.invalidate();
      utils.marketplace.sellerKpis.invalidate();
    },
  });

  const deleteProduct = trpc.marketplace.deleteProduct.useMutation({
    onSuccess: () => {
      utils.marketplace.listMyProducts.invalidate();
      utils.marketplace.sellerKpis.invalidate();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes produits</h1>
          <p className="text-sm text-gray-500">
            Gérez vos produits publiés sur le marketplace.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-800"
        >
          <Plus className="h-4 w-4" />
          Publier un produit
        </button>
      </div>

      <SellerKpis />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      {/* Product table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
          </div>
        ) : !data?.items.length ? (
          <div className="py-16 text-center">
            <p className="text-gray-500">Aucun produit publié.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-sm font-medium text-green-700 hover:underline"
            >
              Publier votre premier produit
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Prix / kg</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((product) => (
                <tr key={product.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.photoUrl ? (
                        <img
                          src={product.photoUrl}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                          IMG
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        {product.location && (
                          <p className="text-xs text-gray-400">{String(product.location)}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="default">
                      {productCategoryLabels[product.category as ProductCategory] ?? product.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {new Intl.NumberFormat('fr-SN').format(Number(product.pricePerKg))} FCFA
                  </td>
                  <td className="px-4 py-3">
                    {new Intl.NumberFormat('fr-SN').format(Number(product.quantityAvailable))} {String(product.unit ?? 'kg')}
                  </td>
                  <td className="px-4 py-3">
                    {product.isPublished ? (
                      <Badge variant="success">Publié</Badge>
                    ) : (
                      <Badge variant="warning">Masqué</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() =>
                          togglePublish.mutate({
                            id: product.id,
                            isPublished: !product.isPublished,
                          })
                        }
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title={product.isPublished ? 'Masquer' : 'Publier'}
                      >
                        {product.isPublished ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteProduct.mutate({ productId: product.id })}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.total > 25 && (
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

      {showCreate && <ProductCreateForm onClose={() => setShowCreate(false)} />}
    </div>
  );
}
