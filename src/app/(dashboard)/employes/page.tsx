'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Users, Search } from 'lucide-react';

const roleLabels: Record<string, string> = {
  owner: 'Propriétaire',
  manager: 'Gestionnaire',
  technician: 'Technicien',
  worker: 'Ouvrier',
  admin: 'Administrateur',
};

const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  technician: 'bg-green-100 text-green-700',
  worker: 'bg-gray-100 text-gray-700',
  admin: 'bg-red-100 text-red-700',
};

export default function EmployesPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = trpc.farmMember.list.useQuery({
    search: search || undefined,
  });

  const members = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Employés</h1>
        <p className="mt-1 text-sm text-gray-500">
          Membres de l&apos;exploitation et leurs rôles
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un employé..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm"
        />
      </div>

      {/* Members list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : members.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Nom</th>
                <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 font-medium text-gray-600">Rôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-medium text-green-700">
                        {(member.name ?? '?')[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">
                        {member.name ?? 'Sans nom'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{member.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        roleColors[member.role] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {roleLabels[member.role] ?? member.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <Users className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-400">Aucun employé trouvé</p>
        </div>
      )}

      <p className="text-right text-xs text-gray-400">
        {members.length} membre{members.length > 1 ? 's' : ''} au total
      </p>
    </div>
  );
}
