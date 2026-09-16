'use client';

import { useState } from 'react';
import { Users, UserPlus, Shield, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const roleLabels: Record<string, string> = {
  owner: 'Proprietaire',
  manager: 'Gestionnaire',
  worker: 'Ouvrier',
  viewer: 'Observateur',
};

const roleBadgeVariant: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  owner: 'success',
  manager: 'info',
  worker: 'warning',
  viewer: 'default',
};

const roleOptions = [
  { value: 'manager', label: 'Gestionnaire' },
  { value: 'worker', label: 'Ouvrier' },
  { value: 'viewer', label: 'Observateur' },
];

export function UsersManager() {
  const [search, setSearch] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('worker');
  const [inviteMessage, setInviteMessage] = useState('');

  const { data, isLoading, refetch } = trpc.farmMember.list.useQuery({
    search: search || undefined,
  });

  const updateRoleMutation = trpc.farmMember.updateRole.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const removeMutation = trpc.farmMember.remove.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const inviteMutation = trpc.farmMember.invite.useMutation({
    onSuccess: (result) => {
      setInviteEmail('');
      setInviteMessage(`Code d'invitation: ${result.token}`);
      setTimeout(() => setInviteMessage(''), 10000);
    },
  });

  const handleInvite = () => {
    if (!inviteEmail) return;
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const handleUpdateRole = (userId: string, role: string) => {
    updateRoleMutation.mutate({ userId, role });
  };

  const handleRemove = (userId: string, name: string) => {
    if (confirm(`Retirer ${name} de l'exploitation ?`)) {
      removeMutation.mutate({ userId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite section */}
      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <UserPlus className="h-5 w-5" />
          Inviter un membre
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Email"
              type="email"
              placeholder="membre@email.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              label="Role"
              options={roleOptions}
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            />
          </div>
          <Button
            onClick={handleInvite}
            disabled={inviteMutation.isPending || !inviteEmail}
          >
            {inviteMutation.isPending ? 'Envoi...' : 'Inviter'}
          </Button>
        </div>

        {inviteMessage && (
          <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {inviteMessage}
          </div>
        )}

        {inviteMutation.isError && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            Erreur: {inviteMutation.error.message}
          </div>
        )}
      </Card>

      {/* Members list */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Users className="h-5 w-5" />
            Membres ({data?.items.length ?? 0})
          </h3>
          <div className="w-64">
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {data.items.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
                    {member.name?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={roleBadgeVariant[member.role] ?? 'default'}>
                    {roleLabels[member.role] ?? member.role}
                  </Badge>

                  {member.role !== 'owner' && (
                    <div className="flex items-center gap-1">
                      <select
                        className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600"
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                        disabled={updateRoleMutation.isPending}
                      >
                        <option value="manager">Gestionnaire</option>
                        <option value="worker">Ouvrier</option>
                        <option value="viewer">Observateur</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemove(member.id, member.name ?? '')}
                        disabled={removeMutation.isPending}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        aria-label="Retirer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">Aucun membre trouve</p>
        )}
      </Card>
    </div>
  );
}
