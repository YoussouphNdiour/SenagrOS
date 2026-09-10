'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CooperativeListClient } from './CooperativeListClient';
import { CooperativeDetailClient } from './CooperativeDetailClient';
import { AcceptInvitationClient } from './AcceptInvitationClient';
import { Modal } from '@/components/ui/Modal';

export function CooperativePageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const acceptToken = searchParams.get('accept');

  const handleAcceptDone = () => {
    // Remove the accept param from URL
    router.replace('/parametres/cooperative');
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left column: cooperative list */}
      <div className="lg:col-span-1">
        <CooperativeListClient onSelect={setSelectedId} selectedId={selectedId} />
      </div>

      {/* Right column: detail or empty state */}
      <div className="lg:col-span-2">
        {selectedId ? (
          <CooperativeDetailClient cooperativeId={selectedId} />
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl bg-gray-50 text-center">
            <p className="text-sm text-gray-500">
              Sélectionnez une coopérative pour voir ses détails
            </p>
          </div>
        )}
      </div>

      {/* Accept invitation modal */}
      {Boolean(acceptToken) && (
        <Modal
          isOpen={true}
          onClose={handleAcceptDone}
          title="Accepter une invitation"
        >
          <AcceptInvitationClient token={acceptToken as string} onDone={handleAcceptDone} />
        </Modal>
      )}
    </div>
  );
}
