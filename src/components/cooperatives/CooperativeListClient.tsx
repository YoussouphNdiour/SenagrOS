'use client';

import { useState } from 'react';
import { Building2, Users, MapPin, ChevronRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CooperativeCreateForm } from './CooperativeCreateForm';
import { cooperativeTypeLabels, type CooperativeType } from '@/lib/validators/cooperative.validator';

interface CooperativeListClientProps {
  onSelect: (id: string) => void;
  selectedId: string | null;
}

export function CooperativeListClient({ onSelect, selectedId }: CooperativeListClientProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isLoading } = trpc.cooperative.list.useQuery({
    search: search || undefined,
    page: 1,
    limit: 50,
  });

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une coopérative..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
        >
          + Créer
        </button>
      </div>

      {isLoading && (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
        </div>
      )}

      {!isLoading && data?.items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 py-12 text-center">
          <Building2 className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">
            Aucune coopérative. Créez-en une ou acceptez une invitation.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {data?.items.map((coop) => (
          <button
            type="button"
            key={coop.id}
            onClick={() => onSelect(coop.id)}
            className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
              selectedId === coop.id
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{coop.name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Badge variant="info">
                    {cooperativeTypeLabels[coop.type as CooperativeType] ?? coop.type}
                  </Badge>
                  {Boolean(coop.region) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {coop.region}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        ))}
      </div>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Créer une coopérative"
      >
        <CooperativeCreateForm
          onSuccess={() => setShowCreate(false)}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}
