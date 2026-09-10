'use client';

import { useState } from 'react';
import { OrderListClient } from '@/components/marketplace/OrderListClient';

type Tab = 'received' | 'placed';

export default function CommandesPage() {
  const [tab, setTab] = useState<Tab>('received');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
        <p className="text-sm text-gray-500">
          Gérez vos commandes reçues et passées.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setTab('received')}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            tab === 'received'
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Commandes reçues
        </button>
        <button
          type="button"
          onClick={() => setTab('placed')}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            tab === 'placed'
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Commandes passées
        </button>
      </div>

      <OrderListClient mode={tab} />
    </div>
  );
}
