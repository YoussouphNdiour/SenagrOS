'use client';

import { useState } from 'react';
import { X, ShoppingCart, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import {
  deliveryMethodLabels,
  type DeliveryMethod,
} from '@/lib/validators/marketplace.validator';

interface OrderModalProps {
  productId: string;
  onClose: () => void;
}

export function OrderModal({ productId, onClose }: OrderModalProps) {
  const { data: product } = trpc.marketplace.getProduct.useQuery({ productId });
  const utils = trpc.useUtils();

  const [quantity, setQuantity] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

  const createOrder = trpc.marketplace.createOrder.useMutation({
    onSuccess: () => {
      setSuccess(true);
      utils.marketplace.listAll.invalidate();
      utils.marketplace.listPlacedOrders.invalidate();
    },
  });

  const totalAmount = product
    ? Number(quantity || 0) * Number(product.pricePerKg)
    : 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quantity || Number(quantity) <= 0) return;
    createOrder.mutate({
      productId,
      quantity: Number(quantity),
      deliveryMethod,
      deliveryAddress: deliveryAddress || undefined,
      notes: notes || undefined,
    });
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-xl">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">Commande envoyée !</h2>
          <p className="mt-2 text-sm text-gray-500">
            Votre commande a été transmise au producteur. Vous pouvez suivre son statut
            dans vos commandes.
          </p>
          <button
            onClick={onClose}
            className="mt-6 rounded-lg bg-green-700 px-6 py-2.5 font-medium text-white hover:bg-green-800"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Passer une commande</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {product && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="font-medium text-gray-900">{product.name}</p>
              <p className="text-sm text-gray-500">
                {new Intl.NumberFormat('fr-SN').format(Number(product.pricePerKg))} FCFA / kg
                — {new Intl.NumberFormat('fr-SN').format(Number(product.quantityAvailable))} kg disponibles
              </p>
            </div>

            <div>
              <label htmlFor="order-quantity" className="mb-1 block text-sm font-medium text-gray-700">
                Quantité (kg)
              </label>
              <input
                id="order-quantity"
                type="number"
                step="0.1"
                min="0.1"
                max={String(product.quantityAvailable)}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label htmlFor="delivery-method" className="mb-1 block text-sm font-medium text-gray-700">
                Mode de livraison
              </label>
              <select
                id="delivery-method"
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              >
                {Object.entries(deliveryMethodLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {deliveryMethod === 'delivery' && (
              <div>
                <label htmlFor="delivery-address" className="mb-1 block text-sm font-medium text-gray-700">
                  Adresse de livraison
                </label>
                <textarea
                  id="delivery-address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            )}

            <div>
              <label htmlFor="order-notes" className="mb-1 block text-sm font-medium text-gray-700">
                Notes (optionnel)
              </label>
              <textarea
                id="order-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            {/* Total */}
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <span className="text-sm text-gray-600">Total : </span>
              <span className="text-xl font-bold text-green-700">
                {new Intl.NumberFormat('fr-SN').format(totalAmount)} FCFA
              </span>
            </div>

            {createOrder.error && (
              <p className="text-sm text-red-600">{createOrder.error.message}</p>
            )}

            <button
              type="submit"
              disabled={createOrder.isPending || !quantity || Number(quantity) <= 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-3 font-medium text-white transition hover:bg-green-800 disabled:opacity-50"
            >
              <ShoppingCart className="h-5 w-5" />
              {createOrder.isPending ? 'Envoi en cours...' : 'Confirmer la commande'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
