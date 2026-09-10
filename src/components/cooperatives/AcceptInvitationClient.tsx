'use client';

import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface AcceptInvitationClientProps {
  token: string;
  onDone: () => void;
}

export function AcceptInvitationClient({ token, onDone }: AcceptInvitationClientProps) {
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');

  const acceptMutation = trpc.cooperative.accept.useMutation({
    onSuccess: () => setStatus('success'),
    onError: () => setStatus('error'),
  });

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-green-50 p-6 text-center">
        <CheckCircle className="h-10 w-10 text-green-600" />
        <p className="font-medium text-green-800">Invitation acceptée avec succès !</p>
        <p className="text-sm text-green-600">Votre ferme a rejoint la coopérative.</p>
        <button
          type="button"
          onClick={onDone}
          className="mt-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Continuer
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-red-50 p-6 text-center">
        <XCircle className="h-10 w-10 text-red-600" />
        <p className="font-medium text-red-800">Erreur lors de l'acceptation</p>
        <p className="text-sm text-red-600">
          {acceptMutation.error?.message ?? 'L\'invitation est invalide ou a expiré.'}
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-blue-50 p-6 text-center">
      <p className="font-medium text-blue-800">Invitation à rejoindre une coopérative</p>
      <p className="text-sm text-blue-600">
        Voulez-vous accepter cette invitation ?
      </p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Refuser
        </button>
        <button
          type="button"
          disabled={acceptMutation.isPending}
          onClick={() => acceptMutation.mutate({ token })}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {acceptMutation.isPending ? 'Acceptation...' : 'Accepter'}
        </button>
      </div>
    </div>
  );
}
