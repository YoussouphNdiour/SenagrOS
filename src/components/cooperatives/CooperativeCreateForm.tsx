'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { cooperativeTypeLabels, type CooperativeType } from '@/lib/validators/cooperative.validator';

interface CooperativeCreateFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const typeOptions = Object.entries(cooperativeTypeLabels) as [CooperativeType, string][];

export function CooperativeCreateForm({ onSuccess, onCancel }: CooperativeCreateFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState('');
  const [type, setType] = useState<CooperativeType>('cooperative');

  const utils = trpc.useUtils();
  const createMutation = trpc.cooperative.create.useMutation({
    onSuccess: () => {
      utils.cooperative.list.invalidate();
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      description: description || undefined,
      region: region || undefined,
      type,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="coop-name" className="mb-1 block text-sm font-medium text-gray-700">
          Nom *
        </label>
        <input
          id="coop-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          placeholder="Nom de la coopérative"
        />
      </div>

      <div>
        <label htmlFor="coop-type" className="mb-1 block text-sm font-medium text-gray-700">
          Type
        </label>
        <select
          id="coop-type"
          value={type}
          onChange={(e) => setType(e.target.value as CooperativeType)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          {typeOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="coop-region" className="mb-1 block text-sm font-medium text-gray-700">
          Région
        </label>
        <input
          id="coop-region"
          type="text"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          placeholder="ex: Saint-Louis, Casamance..."
        />
      </div>

      <div>
        <label htmlFor="coop-description" className="mb-1 block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="coop-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          placeholder="Description de la coopérative..."
        />
      </div>

      {createMutation.error && (
        <p className="text-sm text-red-600">{createMutation.error.message}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Création...' : 'Créer'}
        </button>
      </div>
    </form>
  );
}
