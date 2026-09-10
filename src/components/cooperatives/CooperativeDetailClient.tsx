'use client';

import { useState } from 'react';
import { Users, Copy, Check, Send, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CooperativeKpis } from './CooperativeKpis';
import { cooperativeRoleLabels, type CooperativeRole } from '@/lib/validators/cooperative.validator';

interface CooperativeDetailClientProps {
  cooperativeId: string;
}

export function CooperativeDetailClient({ cooperativeId }: CooperativeDetailClientProps) {
  const [showInvite, setShowInvite] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: members, isLoading: membersLoading } = trpc.cooperative.members.useQuery({
    cooperativeId,
  });

  const { data: invitations } = trpc.cooperative.pendingInvitations.useQuery({
    cooperativeId,
  });

  const { data: availableFarms } = trpc.cooperative.availableFarms.useQuery(
    { cooperativeId },
    { enabled: showInvite },
  );

  const inviteMutation = trpc.cooperative.invite.useMutation({
    onSuccess: () => {
      utils.cooperative.pendingInvitations.invalidate();
      utils.cooperative.availableFarms.invalidate();
      setShowInvite(false);
      setSelectedFarmId('');
    },
  });

  const isAdmin = Boolean(members?.some((m) => m.role === 'admin'));

  const handleCopyToken = (token: string) => {
    const url = `${window.location.origin}/parametres/cooperative?accept=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Dashboard KPIs */}
      <CooperativeKpis cooperativeId={cooperativeId} />

      {/* Farm details table */}
      <FarmDetailsTable cooperativeId={cooperativeId} />

      {/* Members */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            <Users className="mr-2 inline h-5 w-5" />
            Membres ({members?.length ?? 0})
          </h3>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition"
            >
              <Send className="h-4 w-4" />
              Inviter
            </button>
          )}
        </div>

        {membersLoading ? (
          <div className="flex h-20 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {members?.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-800">{member.farmName}</p>
                  <p className="text-xs text-gray-500">
                    Membre depuis {new Date(member.joinedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <Badge variant={member.role === 'admin' ? 'success' : 'default'}>
                  {cooperativeRoleLabels[member.role as CooperativeRole] ?? member.role}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {isAdmin && invitations && invitations.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">
            Invitations en attente ({invitations.length})
          </h3>
          <div className="divide-y divide-gray-100">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-800">{inv.farmName}</p>
                  <p className="text-xs text-gray-500">
                    Expire le {new Date(inv.expiresAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyToken(inv.token)}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  {copiedToken === inv.token ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copier le lien
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite modal */}
      <Modal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        title="Inviter une ferme"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="invite-farm" className="mb-1 block text-sm font-medium text-gray-700">
              Ferme à inviter
            </label>
            <select
              id="invite-farm"
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">Sélectionner une ferme...</option>
              {availableFarms?.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>
          </div>

          {inviteMutation.error && (
            <p className="text-sm text-red-600">{inviteMutation.error.message}</p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={!selectedFarmId || inviteMutation.isPending}
              onClick={() => {
                inviteMutation.mutate({
                  cooperativeId,
                  farmId: selectedFarmId,
                });
              }}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {inviteMutation.isPending ? 'Envoi...' : 'Envoyer l\'invitation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Sub-component: Farm details table from dashboard
function FarmDetailsTable({ cooperativeId }: { cooperativeId: string }) {
  const { data } = trpc.cooperative.dashboard.useQuery({ cooperativeId });

  if (!data?.farmDetails || data.farmDetails.length === 0) return null;

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Détail par ferme</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-3 py-2">Ferme</th>
              <th className="px-3 py-2 text-right">Surface (ha)</th>
              <th className="px-3 py-2 text-right">Production (kg)</th>
              <th className="px-3 py-2 text-right">CA (FCFA)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.farmDetails.map((farm) => (
              <tr key={farm.farmId} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-medium text-gray-800">{farm.farmName}</td>
                <td className="px-3 py-2 text-right text-gray-600">{farm.surfaceHa.toFixed(1)}</td>
                <td className="px-3 py-2 text-right text-gray-600">
                  {new Intl.NumberFormat('fr-FR').format(Math.round(farm.productionKg))}
                </td>
                <td className="px-3 py-2 text-right text-gray-600">
                  {new Intl.NumberFormat('fr-FR').format(Math.round(farm.revenueXof))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 font-semibold text-gray-800">
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-right">{data.totalSurfaceHa.toFixed(1)}</td>
              <td className="px-3 py-2 text-right">
                {new Intl.NumberFormat('fr-FR').format(Math.round(data.totalProductionKg))}
              </td>
              <td className="px-3 py-2 text-right">
                {new Intl.NumberFormat('fr-FR').format(Math.round(data.totalRevenueXof))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
