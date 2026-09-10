'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import {
  productCategoryLabels,
  type ProductCategory,
} from '@/lib/validators/marketplace.validator';

interface ProductCreateFormProps {
  onClose: () => void;
}

export function ProductCreateForm({ onClose }: ProductCreateFormProps) {
  const utils = trpc.useUtils();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('cereales');
  const [photoUrl, setPhotoUrl] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [quantityAvailable, setQuantityAvailable] = useState('');
  const [unit, setUnit] = useState('kg');
  const [location, setLocation] = useState('');
  const [isBio, setIsBio] = useState(false);

  const create = trpc.marketplace.createProduct.useMutation({
    onSuccess: () => {
      utils.marketplace.listMyProducts.invalidate();
      utils.marketplace.sellerKpis.invalidate();
      onClose();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      name,
      description: description || undefined,
      category,
      photoUrl: photoUrl || undefined,
      pricePerKg: Number(pricePerKg),
      quantityAvailable: Number(quantityAvailable),
      unit,
      location: location || undefined,
      isBio,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Publier un produit</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label htmlFor="product-name" className="mb-1 block text-sm font-medium text-gray-700">
                Nom du produit *
              </label>
              <input
                id="product-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Arachide, Oignon, Tomate..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                required
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="product-description" className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="product-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="product-category" className="mb-1 block text-sm font-medium text-gray-700">
                Catégorie *
              </label>
              <select
                id="product-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              >
                {Object.entries(productCategoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="product-photo" className="mb-1 block text-sm font-medium text-gray-700">
                URL photo
              </label>
              <input
                id="product-photo"
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="product-price" className="mb-1 block text-sm font-medium text-gray-700">
                Prix / kg (FCFA) *
              </label>
              <input
                id="product-price"
                type="number"
                step="1"
                min="1"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label htmlFor="product-qty" className="mb-1 block text-sm font-medium text-gray-700">
                Quantité disponible *
              </label>
              <div className="flex gap-2">
                <input
                  id="product-qty"
                  type="number"
                  step="0.1"
                  min="0"
                  value={quantityAvailable}
                  onChange={(e) => setQuantityAvailable(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  required
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-20 rounded-lg border border-gray-200 px-2 py-2 text-sm"
                >
                  <option value="kg">kg</option>
                  <option value="t">t</option>
                  <option value="sac">sac</option>
                  <option value="unité">unité</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="product-location" className="mb-1 block text-sm font-medium text-gray-700">
                Localisation
              </label>
              <input
                id="product-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Dakar, SN"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isBio}
                  onChange={(e) => setIsBio(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                Produit Bio
              </label>
            </div>
          </div>

          {create.error && (
            <p className="text-sm text-red-600">{create.error.message}</p>
          )}

          <button
            type="submit"
            disabled={create.isPending}
            className="w-full rounded-lg bg-green-700 px-4 py-3 font-medium text-white transition hover:bg-green-800 disabled:opacity-50"
          >
            {create.isPending ? 'Publication...' : 'Publier sur le Marketplace'}
          </button>
        </form>
      </div>
    </div>
  );
}
