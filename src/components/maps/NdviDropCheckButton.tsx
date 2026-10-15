'use client';

import { useState } from 'react';
import { BellRing, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * Declencheur manuel de la detection des chutes de NDVI.
 *
 * Il n'existe aucun ordonnanceur dans la pile (ni cron, ni cle d'API
 * exploitee), donc rien ne lance la verification tout seul. Ce bouton rend
 * la fonction utilisable des maintenant ; brancher un declenchement
 * periodique reste a faire.
 */
export function NdviDropCheckButton() {
  const utils = trpc.useUtils();
  const [summary, setSummary] = useState<string | null>(null);

  const check = trpc.ndvi.checkDrops.useMutation({
    onSuccess: (r) => {
      utils.notification.invalidate();
      setSummary(
        r.alerted > 0
          ? `${r.alerted} alerte${r.alerted > 1 ? 's' : ''} créée${r.alerted > 1 ? 's' : ''} sur ${r.checked} parcelle${r.checked > 1 ? 's' : ''} analysée${r.checked > 1 ? 's' : ''}.`
          : `Aucune baisse détectée sur ${r.checked} parcelle${r.checked > 1 ? 's' : ''} analysée${r.checked > 1 ? 's' : ''}.`,
      );
    },
    onError: (e) => setSummary(e.message),
  });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => {
          setSummary(null);
          check.mutate();
        }}
        disabled={check.isPending}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
        title="Analyser les parcelles et notifier les baisses de NDVI"
      >
        {check.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <BellRing className="h-4 w-4 text-amber-500" />
        )}
        Vérifier les baisses de NDVI
      </button>
      {summary && <span className="text-xs text-gray-500">{summary}</span>}
    </div>
  );
}
