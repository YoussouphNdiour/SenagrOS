'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import {
  formatFCFA,
  paymentMethodLabels,
} from '@/lib/validators/finance.validator';

const paymentMethodOptions = [
  { value: 'cash', label: paymentMethodLabels.cash },
  { value: 'bank', label: paymentMethodLabels.bank },
  { value: 'mobile_money', label: paymentMethodLabels.mobile_money },
];

interface FormErrors {
  productName?: string;
  quantity?: string;
  unitPrice?: string;
  date?: string;
}

export function VenteCreateForm() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [clientName, setClientName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'mobile_money'>('cash');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');

  const createMutation = trpc.finance.createSale.useMutation({
    onSuccess: () => {
      utils.finance.listSales.invalidate();
      utils.finance.salesKpis.invalidate();
      router.push('/ventes');
    },
    onError: (err) => setServerError(err.message),
  });

  const qty = Number(quantity);
  const price = Number(unitPrice);
  const total = !Number.isNaN(qty) && !Number.isNaN(price) && qty > 0 && price > 0
    ? qty * price
    : null;

  function validate(): boolean {
    const next: FormErrors = {};
    if (!productName.trim()) next.productName = 'Le produit est requis';
    if (!quantity || qty <= 0) next.quantity = 'La quantité doit être positive';
    if (!unitPrice || price <= 0) next.unitPrice = 'Le prix unitaire doit être positif';
    if (!date) next.date = 'La date est requise';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    createMutation.mutate({
      productName: productName.trim(),
      quantity: qty,
      unitPrice: price,
      unit: unit.trim() || undefined,
      clientName: clientName.trim() || undefined,
      date,
      paymentMethod,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      {serverError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{serverError}</div>
      )}

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-700">Informations produit</h2>
        <div className="space-y-4">
          <Input
            id="productName"
            label="Produit *"
            placeholder="Ex: Mil, Arachide, Tomate..."
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            error={errors.productName}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="quantity"
              label="Quantité *"
              type="number"
              min="0.001"
              step="0.001"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              error={errors.quantity}
            />
            <Input
              id="unitPrice"
              label="Prix unitaire (FCFA) *"
              type="number"
              min="1"
              step="1"
              placeholder="0"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              error={errors.unitPrice}
            />
            <Input
              id="unit"
              label="Unité"
              placeholder="kg, sac, tonne..."
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          {total !== null && (
            <div className="rounded-lg bg-green-50 px-4 py-3">
              <p className="text-sm text-gray-600">Total calculé</p>
              <p className="text-xl font-bold text-green-700">{formatFCFA(total)}</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-700">Client & paiement</h2>
        <div className="space-y-4">
          <Input
            id="clientName"
            label="Nom du client"
            placeholder="Nom ou raison sociale"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="date"
              label="Date *"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              error={errors.date}
            />
            <Select
              id="paymentMethod"
              label="Mode de paiement"
              options={paymentMethodOptions}
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as 'cash' | 'bank' | 'mobile_money')
              }
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-700">Notes</h2>
        <textarea
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          rows={3}
          placeholder="Remarques ou informations complémentaires..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/ventes')}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer la vente'}
        </Button>
      </div>
    </form>
  );
}
