'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import {
  formatFCFA,
  invoiceTypeLabels,
  type InvoiceType,
} from '@/lib/validators/finance.validator';

interface ItemRow {
  _id: string;
  productName: string;
  quantity: string;
  unitPrice: string;
}

let itemCounter = 0;
function makeItem(): ItemRow {
  return { _id: String(++itemCounter), productName: '', quantity: '', unitPrice: '' };
}

const typeOptions = (Object.keys(invoiceTypeLabels) as InvoiceType[]).map((v) => ({
  value: v,
  label: invoiceTypeLabels[v],
}));

export function InvoiceCreateForm() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const t = useTranslations('finances');
  const tc = useTranslations('common');

  const [type, setType] = useState<InvoiceType>('devis');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<ItemRow[]>([makeItem()]);
  const [taxAmount, setTaxAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const createMutation = trpc.finance.createInvoice.useMutation({
    onSuccess: () => {
      utils.finance.listInvoices.invalidate();
      utils.finance.invoiceKpis.invalidate();
      router.push('/facturation');
    },
    onError: (err) => setError(err.message),
  });

  const updateItem = (index: number, field: keyof ItemRow, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addItem = () => setItems((prev) => [...prev, makeItem()]);

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const computeItemTotal = (item: ItemRow): number => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return qty * price;
  };

  const subtotal = items.reduce((sum, item) => sum + computeItemTotal(item), 0);
  const tax = parseFloat(taxAmount) || 0;
  const grandTotal = subtotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validItems = items.filter(
      (item) => item.productName.trim() && parseFloat(item.quantity) > 0 && parseFloat(item.unitPrice) > 0,
    );

    if (validItems.length === 0) {
      setError(t('invoiceFormAddLine'));
      return;
    }

    createMutation.mutate({
      type,
      clientName,
      clientEmail: clientEmail || undefined,
      clientPhone: clientPhone || undefined,
      issueDate,
      dueDate: dueDate || undefined,
      items: validItems.map((item) => ({
        productName: item.productName.trim(),
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        total: computeItemTotal(item),
      })),
      taxAmount: tax > 0 ? tax : undefined,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Type */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-700">{t('invoiceFormDocType')}</h2>
        <Select
          label={tc('type')}
          id="invoice-type"
          options={typeOptions}
          value={type}
          onChange={(e) => setType(e.target.value as InvoiceType)}
        />
      </div>

      {/* Client */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-700">{t('invoiceFormClientSection')}</h2>
        <div className="space-y-4">
          <Input
            label={t('invoiceFormClientName')}
            id="client-name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            placeholder="Mamadou Diallo"
          />
          <Input
            label={t('invoiceFormClientEmail')}
            id="client-email"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="client@exemple.com"
          />
          <Input
            label={t('invoiceFormClientPhone')}
            id="client-phone"
            type="tel"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="+221 77 000 00 00"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-700">{t('invoiceFormDateSection')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('invoiceFormIssueDate')}
            id="issue-date"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            required
          />
          <Input
            label={t('invoiceFormDueDate')}
            id="due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      {/* Articles */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-700">{t('invoiceFormLinesSection')}</h2>
        <div className="space-y-3">
          {/* Column headers */}
          <div className="hidden grid-cols-[1fr_80px_110px_110px_32px] gap-2 sm:grid">
            <span className="text-xs font-medium text-gray-400">{t('invoiceFormProduct')}</span>
            <span className="text-xs font-medium text-gray-400">{t('invoiceFormQty')}</span>
            <span className="text-xs font-medium text-gray-400">{t('invoiceFormUnitPrice')}</span>
            <span className="text-xs font-medium text-gray-400">{t('invoiceFormTotal')}</span>
            <span />
          </div>

          {items.map((item, index) => {
            const total = computeItemTotal(item);
            return (
              <div
                key={item._id}
                className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_80px_110px_110px_32px] sm:items-center"
              >
                <Input
                  placeholder={t('invoiceFormProduct')}
                  value={item.productName}
                  onChange={(e) => updateItem(index, 'productName', e.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t('invoiceFormQty')}
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder={t('invoiceFormUnitPrice')}
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                />
                <div className="flex h-10 items-center rounded-lg bg-gray-50 px-3 text-sm text-gray-700">
                  {total > 0 ? formatFCFA(total) : '—'}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={addItem}
        >
          <Plus className="h-4 w-4" />
          {t('invoiceFormAddLine')}
        </Button>
      </div>

      {/* Tax & notes */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-700">{t('invoiceFormTaxSection')}</h2>
        <div className="space-y-4">
          <Input
            label={t('invoiceFormTax')}
            id="tax-amount"
            type="number"
            min="0"
            step="1"
            value={taxAmount}
            onChange={(e) => setTaxAmount(e.target.value)}
          />
          <div>
            <label
              htmlFor="notes"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('invoiceFormNotes')}
            </label>
            <textarea
              id="notes"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Total summary */}
      <div className="rounded-xl bg-gray-50 px-5 py-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Sous-total</span>
          <span>{formatFCFA(subtotal)}</span>
        </div>
        {tax > 0 && (
          <div className="mt-1 flex items-center justify-between text-sm text-gray-600">
            <span>{t('invoiceFormTax')}</span>
            <span>{formatFCFA(tax)}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-800">
          <span>{tc('total')}</span>
          <span className="text-green-700">{formatFCFA(grandTotal)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.push('/facturation')}
        >
          {tc('cancel')}
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? tc('creating') : tc('create')}
        </Button>
      </div>
    </form>
  );
}
